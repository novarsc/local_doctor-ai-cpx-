/**
 * @file practiceSession.service.js
 * @description Business logic for managing practice sessions.
 */

const { PracticeSession, Scenario, AIPatientPersonality, ChatLog, EvaluationResult } = require('../models');
const ApiError = require('../utils/ApiError');
// ai.service 전체를 가져옵니다.
const aiService = require('./ai.service');

// 실시간 대화 세션을 임시로 저장할 객체입니다. (서버 재시작 시 초기화됩니다)
const activeChatSessions = new Map();

// startPracticeSession and sendMessageAndGetResponse functions remain unchanged...
const startPracticeSession = async (sessionData, userId) => {
    const { scenarioId, selectedAiPersonalityId, practiceMode } = sessionData;
  
    // 1. 필요한 정보를 DB에서 조회합니다. (AIPatientPersonality 포함)
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) throw new ApiError(404, 'S001_SCENARIO_NOT_FOUND', 'Scenario not found.');
  
    // selectedAiPersonalityId가 없으면 scenario의 defaultAiPersonalityId를 사용합니다.
    const personalityId = selectedAiPersonalityId || scenario.defaultAiPersonalityId;
    const personality = await AIPatientPersonality.findByPk(personalityId);
    if (!personality) throw new ApiError(404, 'P005_PERSONALITY_NOT_FOUND', 'AI personality not found.');
  
    // 2. aiService를 이용해 LLM 채팅 세션을 미리 초기화합니다.
    // 이 과정에서 시스템 프롬프트 주입 및 증례 YAML 학습이 일어납니다.
    const { chat, initialHistory } = await aiService.initializeChat(scenario, personality);
  
    // 3. DB에 실습 세션 정보를 생성합니다.
    const newSession = await PracticeSession.create({
      userId,
      scenarioId,
      selectedAiPersonalityId: personality.personalityId,
      practiceMode,
      status: 'started',
    });
  
    // 4. 생성된 세션 ID를 key로 하여, 이어질 대화에서 사용할 chat 객체를 임시 저장합니다.
    activeChatSessions.set(newSession.practiceSessionId, chat);
  
    // 5. 프론트엔드의 '실습 전 페이지'에 표시할 환자 초기 정보를 반환합니다.
    // 증례 YAML에 있는 초기 응답 내용을 활용할 수도 있습니다.
    const firstModelResponse = initialHistory.find(h => h.role === 'model')?.parts[0]?.text || '';
  
    return {
      practiceSessionId: newSession.practiceSessionId,
      userId: newSession.userId,
      scenarioId: newSession.scenarioId,
      startTime: newSession.startTime,
      status: newSession.status,
      // API 명세에 따라 AI 환자의 첫 상호작용 정보를 구성하여 반환합니다.
      aiPatientInitialInteraction: {
        type: 'text',
        data: {
          messageId: 'chat-msg-0',
          sender: 'ai',
          content: firstModelResponse, // AI가 생성한 첫 응답
          timestamp: new Date().toISOString(),
        },
      },
    };
  };
  
  const sendMessageAndGetResponse = async (sessionId, userId, messageContent) => {
    // 1. 진행 중인 대화 세션을 임시 저장소에서 가져옵니다.
    const chat = activeChatSessions.get(sessionId);
    if (!chat) {
      throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Active chat session not found or has expired.');
    }
  
    // 2. 사용자의 메시지를 DB에 기록합니다.
    await ChatLog.create({
      practiceSessionId: sessionId,
      sender: 'user',
      content: messageContent, // controller에서 'message'를 'content'로 변경해야 할 수 있습니다.
      contentType: 'text',
    });
  
    // 3. Gemini SDK의 sendMessageStream을 사용하여 스트리밍 응답을 요청합니다.
    const streamResult = await chat.sendMessageStream(messageContent);
  
    // 4. 컨트롤러로 스트림 결과 자체를 반환하여, 컨트롤러가 직접 스트림을 처리하도록 합니다.
    return streamResult.stream;
  };

/**
 * Completes a practice session and triggers AI evaluation.
 * @param {string} sessionId - The ID of the practice session to complete.
 * @param {string} userId - The ID of the user.
 */
const completePracticeSession = async (sessionId, userId) => {
  const session = await PracticeSession.findOne({ where: { practiceSessionId: sessionId, userId } });
  if (!session) throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Session not found.');
  if (session.status !== 'started') throw new ApiError(400, 'P002_SESSION_ALREADY_COMPLETED', 'Session is not active.');

  // 1. Update session status
  session.status = 'completed';
  session.endTime = new Date();
  await session.save();

  // 2. Trigger evaluation asynchronously (so the user doesn't wait)
  (async () => {
    try {
      const [chatLogs, scenario] = await Promise.all([
        ChatLog.findAll({ where: { practiceSessionId: sessionId }, order: [['createdAt', 'ASC']] }),
        Scenario.findByPk(session.scenarioId),
      ]);
      
      // TODO: Fetch the actual checklist for the scenario
      const checklist = [{ text: '통증 시작 시점에 대해 질문했는가?' }];
      
      const evaluationData = await aiService.evaluatePracticeSession({ chatLogs, scenario, checklist });

      // 3. Save the evaluation result
      await EvaluationResult.create({
        practiceSessionId: sessionId,
        ...evaluationData,
      });

      // 4. Update the final score in the practice session table
      session.finalScore = evaluationData.overallScore;
      await session.save();

    } catch (evalError) {
      console.error(`Evaluation failed for session ${sessionId}:`, evalError);
      // Optionally, mark the session evaluation as 'failed'
    }
  })();

  return { message: 'Session completed. Evaluation has started.' };
};

/**
 * Retrieves the feedback for a completed practice session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} The evaluation result.
 */
const getPracticeSessionFeedback = async (sessionId, userId) => {
    const session = await PracticeSession.findOne({ where: { practiceSessionId: sessionId, userId } });
    if (!session) throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Session not found.');
    
    const result = await EvaluationResult.findOne({ where: { practiceSessionId: sessionId } });
    
    if (!result) {
        return { status: 'evaluating', message: 'Evaluation is in progress. Please check back later.' };
    }
    
    return { status: 'completed', data: result.toJSON() };
};

module.exports = {
  startPracticeSession,
  sendMessageAndGetResponse,
  completePracticeSession,
  getPracticeSessionFeedback,
};
