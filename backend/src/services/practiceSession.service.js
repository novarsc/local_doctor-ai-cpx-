/**
 * @file practiceSession.service.js
 * @description Business logic for managing practice sessions.
 */

const { PracticeSession, Scenario, User, ChatLog, EvaluationResult } = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');

// startPracticeSession and sendMessageAndGetResponse functions remain unchanged...
const startPracticeSession = async (sessionData, userId) => {
  const { scenarioId, selectedAiPersonalityId, practiceMode } = sessionData;
  const [scenario, user] = await Promise.all([Scenario.findByPk(scenarioId),User.findByPk(userId)]);
  if (!scenario) throw new ApiError(404, 'S001_SCENARIO_NOT_FOUND', 'Scenario not found.');
  if (!user) throw new ApiError(404, 'U003_USER_NOT_FOUND', 'User not found.');
  const newSession = await PracticeSession.create({ userId, scenarioId, selectedAiPersonalityId, practiceMode, status: 'started' });
  const initialInteraction = { type: 'text', data: { messageId: 'chat-msg-0', sender: 'ai', content: `${scenario.patientInfo.age}세 ${scenario.patientInfo.sex === 'male' ? '남자' : '여자'} 환자입니다. ${scenario.shortDescription} (으)로 내원하였습니다. 무엇을 도와드릴까요?`, timestamp: new Date().toISOString() } };
  return { practiceSessionId: newSession.practiceSessionId, userId: newSession.userId, scenarioId: newSession.scenarioId, startTime: newSession.startTime, status: newSession.status, aiPatientInitialInteraction: initialInteraction };
};
const sendMessageAndGetResponse = async (sessionId, userId, messageContent) => {
  const session = await PracticeSession.findOne({ where: { practiceSessionId: sessionId, userId } });
  if (!session) throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Practice session not found or access denied.');
  if (session.status !== 'started') throw new ApiError(403, 'P002_SESSION_ALREADY_COMPLETED', 'This session is already completed.');
  await ChatLog.create({ practiceSessionId: sessionId, sender: 'user', content: messageContent, contentType: 'text' });
  const [scenario, chatHistory] = await Promise.all([ Scenario.findByPk(session.scenarioId), ChatLog.findAll({ where: { practiceSessionId: sessionId }, order: [['createdAt', 'ASC']] }) ]);
  const formattedHistory = chatHistory.map(log => ({ role: log.sender === 'user' ? 'user' : 'model', parts: [{ text: log.content }] }));
  const personality = { id: session.selectedAiPersonalityId, name: '기본' }; 
  const systemPrompt = aiService.buildSystemPrompt(scenario, personality);
  const stream = await aiService.getAiPatientResponseStream(systemPrompt, formattedHistory, messageContent);
  return stream;
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
