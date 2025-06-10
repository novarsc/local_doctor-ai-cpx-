/**
 * @file practiceSession.service.js
 * @description Business logic for managing practice sessions. This is a stateful service.
 */

const { PracticeSession, Scenario, AIPatientPersonality, ChatLog, EvaluationResult } = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');

const activeChatHistories = new Map();

const startPracticeSession = async (sessionData, userId) => {
    const { scenarioId, selectedAiPersonalityId, practiceMode } = sessionData;
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) throw new ApiError(404, 'S001_SCENARIO_NOT_FOUND', 'Scenario not found.');
    const personalityId = selectedAiPersonalityId || scenario.defaultAiPersonalityId;
    const personality = await AIPatientPersonality.findByPk(personalityId);
    if (!personality) throw new ApiError(404, 'P005_PERSONALITY_NOT_FOUND', 'AI personality not found.');
    const { history, aiPatientInitialInteraction } = await aiService.initializeChat(scenario, personality);
    const newSession = await PracticeSession.create({
      userId,
      scenarioId,
      selectedAiPersonalityId: personality.personalityId,
      practiceMode,
      status: 'started',
    });
    activeChatHistories.set(newSession.practiceSessionId, history);
    return {
      practiceSessionId: newSession.practiceSessionId,
      userId: newSession.userId,
      scenarioId: newSession.scenarioId,
      startTime: newSession.startTime,
      status: newSession.status,
      aiPatientInitialInteraction: aiPatientInitialInteraction,
    };
};

const sendMessageAndGetResponse = async (sessionId, userId, messageContent) => {
    const history = activeChatHistories.get(sessionId);
    if (!history) {
      throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Active chat session not found or has expired.');
    }
    
    // --- 사용자 메시지 DB 저장 확인 로그 ---
    console.log(`[DB SAVE CHECK] Saving USER message to DB:`, { sessionId, sender: 'USER', message: messageContent });
    await ChatLog.create({
      practiceSessionId: sessionId,
      sender: 'USER',
      message: messageContent,
    });

    const stream = await aiService.sendMessageAndGetResponse(history, messageContent);

    async function* historyAndUpdateStream() {
        let fullAiResponse = "";
        for await (const chunk of stream) {
            const text = chunk.text();
            fullAiResponse += text;
            yield { text: () => text }; 
        }
        
        // --- AI 메시지 DB 저장 확인 로그 (컨트롤러에서 실제로 저장) ---
        console.log(`[DB SAVE CHECK] Full AI response received, to be saved by controller:`, { sessionId, messageContent: fullAiResponse });

        const updatedHistory = [
            ...history,
            { role: 'user', parts: [{ text: messageContent }] },
            { role: 'model', parts: [{ text: fullAiResponse }] }
        ];
        activeChatHistories.set(sessionId, updatedHistory);
    }

    return historyAndUpdateStream();
};

const completePracticeSession = async (sessionId, userId) => {
    const session = await PracticeSession.findOne({ where: { practiceSessionId: sessionId, userId } });
    if (!session) throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Session not found.');
    if (session.status !== 'started') throw new ApiError(400, 'P002_SESSION_ALREADY_COMPLETED', 'Session is not active.');

    activeChatHistories.delete(sessionId);
    
    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    (async () => {
        try {
            const [chatLogs, scenario] = await Promise.all([
                ChatLog.findAll({ where: { practiceSessionId: sessionId }, order: [['createdAt', 'ASC']] }),
                Scenario.findByPk(session.scenarioId),
            ]);
            
            const evaluationData = await aiService.evaluatePracticeSession({ chatLogs, scenario });

            await EvaluationResult.create({
                practiceSessionId: sessionId,
                ...evaluationData,
            });

            session.finalScore = evaluationData.overallScore;
            await session.save();

        } catch (evalError) {
            console.error(`Evaluation failed for session ${sessionId}:`, evalError);
        }
    })();

    return { message: 'Session completed. Evaluation has started.' };
};

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
