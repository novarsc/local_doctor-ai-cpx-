// backend/src/services/practiceSession.service.js

const { 
    PracticeSession, 
    Scenario, 
    AIPatientPersonality, 
    ChatLog, 
    EvaluationResult, 
    UserPracticeHistory 
} = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');

const activeChatHistories = new Map();

const startPracticeSession = async (sessionData, userId) => {
    const { scenarioId, selectedAiPersonalityId, practiceMode } = sessionData;
    await PracticeSession.update(
      { status: 'abandoned', endTime: new Date() },
      { where: { userId: userId, status: 'started' } }
    );
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
    
    const completionTime = new Date();
    session.status = 'completed';
    session.endTime = completionTime;
    
    await session.save();

    await UserPracticeHistory.create({
        userId: session.userId,
        practiceSessionId: session.practiceSessionId,
        scenarioId: session.scenarioId,
        startTime: session.startTime,
        completedAt: completionTime,
        score: null, 
    });

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
            const finalScore = evaluationData.overallScore;
            await session.update({ finalScore: finalScore });
            await UserPracticeHistory.update(
                { score: finalScore },
                { where: { practiceSessionId: sessionId } }
            );
        } catch (evalError) {
            console.error(`Evaluation failed for session ${sessionId}:`, evalError);
        }
    })();

    return { message: 'Session completed. Evaluation has started.' };
};

// --- [추가] 누락되었던 getSessionDetails 함수 ---
const getSessionDetails = async (sessionId, userId) => {
    const session = await PracticeSession.findOne({
        where: { practiceSessionId: sessionId, userId },
        include: [{ model: Scenario, as: 'scenario' }]
    });

    if (!session) {
        throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Session not found or you do not have permission to access it.');
    }
    return session.toJSON();
};
// --- [여기까지 추가] ---

const getPracticeSessionFeedback = async (sessionId, userId) => {
    const session = await PracticeSession.findOne({ where: { practiceSessionId: sessionId, userId } });
    if (!session) throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Session not found.');
    const result = await EvaluationResult.findOne({ where: { practiceSessionId: sessionId } });
    if (!result) {
        return { status: 'evaluating', message: 'Evaluation is in progress. Please check back later.' };
    }
    return { status: 'completed', data: result.toJSON() };
};

const getChatHistory = async (sessionId, userId) => {
  const session = await PracticeSession.findOne({ where: { practiceSessionId: sessionId, userId } });
  if (!session) {
    throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Session not found or you do not have permission to access it.');
  }
  const chatLogs = await ChatLog.findAll({
    where: { practiceSessionId: sessionId },
    order: [['createdAt', 'ASC']],
  });
  const history = chatLogs.map(log => ({
    role: log.sender === 'USER' ? 'user' : 'model',
    parts: [{ text: log.message }],
  }));
  activeChatHistories.set(sessionId, history);
  return chatLogs;
};

module.exports = {
  startPracticeSession,
  sendMessageAndGetResponse,
  completePracticeSession,
  getSessionDetails, // [수정] exports에 추가
  getPracticeSessionFeedback,
  getChatHistory,
};