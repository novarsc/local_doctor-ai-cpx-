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
const { setChatHistory, getChatHistory, hasSession, updateChatHistory } = require('./activeChatHistories');

const startPracticeSession = async (sessionData, userId) => {
    const { scenarioId, selectedAiPersonalityId, practiceMode } = sessionData;
    
    // 트랜잭션 사용하여 세션 상태 변경과 생성을 원자적으로 처리
    const { sequelize } = require('../models');
    
    return await sequelize.transaction(async (transaction) => {
        // 기존 시작된 세션들을 abandoned로 변경 (트랜잭션 내에서)
        await PracticeSession.update(
            { status: 'abandoned', endTime: new Date() },
            { 
                where: { userId: userId, status: 'started' },
                transaction
            }
        );
        
        const scenario = await Scenario.findByPk(scenarioId, { transaction });
        if (!scenario) throw new ApiError(404, 'S001_SCENARIO_NOT_FOUND', 'Scenario not found.');
        
        const personalityId = selectedAiPersonalityId || scenario.defaultAiPersonalityId;
        const personality = await AIPatientPersonality.findByPk(personalityId, { transaction });
        if (!personality) throw new ApiError(404, 'P005_PERSONALITY_NOT_FOUND', 'AI personality not found.');
        
        const { history, aiPatientInitialInteraction } = await aiService.initializeChat(scenario, personality);
        
        // 새 세션 생성 (트랜잭션 내에서)
        const newSession = await PracticeSession.create({
            userId,
            scenarioId,
            selectedAiPersonalityId: personality.personalityId,
            practiceMode,
            status: 'started',
        }, { transaction });
        
        setChatHistory(newSession.practiceSessionId, history);
        
        return {
            practiceSessionId: newSession.practiceSessionId,
            userId: newSession.userId,
            scenarioId: newSession.scenarioId,
            startTime: newSession.startTime,
            status: newSession.status,
            aiPatientInitialInteraction: aiPatientInitialInteraction,
        };
    });
};

const sendMessageAndGetResponse = async (sessionId, userId, messageContent) => {
    console.log('sendMessageAndGetResponse called with:', { sessionId, userId, messageContent });
    
    const history = getChatHistory(sessionId);
    console.log('Retrieved history:', history ? 'found' : 'not found');
    
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
        let fullAiResponse = '';
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
        updateChatHistory(sessionId, updatedHistory);
        console.log('Updated chat history for session:', sessionId);
    }
    return historyAndUpdateStream();
};

// AI 평가 대기열 관리
const evaluationQueue = [];
let isProcessingQueue = false;

// AI 평가를 순차적으로 처리하는 함수
const processEvaluationQueue = async () => {
    if (isProcessingQueue || evaluationQueue.length === 0) {
        return;
    }
    
    isProcessingQueue = true;
    console.log(`📋 AI 평가 처리 시작 - 대기열에 ${evaluationQueue.length}개 평가 대기 중`);
    
    while (evaluationQueue.length > 0) {
        const evaluationTask = evaluationQueue.shift();
        console.log(`🔄 세션 ${evaluationTask.sessionId} 평가 시작`);
        
        try {
            await evaluationTask.execute();
            console.log(`✅ 세션 ${evaluationTask.sessionId} 평가 완료`);
        } catch (error) {
            console.error(`❌ 세션 ${evaluationTask.sessionId} 평가 실패:`, error);
        }
        
        // 각 평가 사이에 1초 대기 (API Rate Limiting 방지)
        if (evaluationQueue.length > 0) {
            console.log('⏳ 다음 평가를 위해 1초 대기...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    isProcessingQueue = false;
    console.log('📋 모든 AI 평가 처리 완료');
};

const completePracticeSession = async (sessionId, userId) => {
    console.log(`[DEBUG] completePracticeSession called: sessionId=${sessionId}, userId=${userId}`);
    
    try {
        const session = await PracticeSession.findOne({ where: { practiceSessionId: sessionId, userId } });
        if (!session) {
            console.log(`[ERROR] Session not found: sessionId=${sessionId}, userId=${userId}`);
            throw new ApiError(404, 'P001_SESSION_NOT_FOUND', 'Session not found.');
        }
        
        console.log(`[DEBUG] Session found: status=${session.status}, startTime=${session.startTime}, endTime=${session.endTime}`);
        
        if (session.status !== 'started' && session.status !== 'in_progress') {
            console.log(`[ERROR] Session is not active: sessionId=${sessionId}, current status=${session.status}, expected=started or in_progress`);
            throw new ApiError(400, 'P002_SESSION_ALREADY_COMPLETED', `Session is not active. Current status: ${session.status}`);
        }

        console.log(`[DEBUG] Updating chat history for session: ${sessionId}`);
        updateChatHistory(sessionId, []);
        
        console.log(`[DEBUG] Setting session status to completed`);
        const completionTime = new Date();
        session.status = 'completed';
        session.endTime = completionTime;
        
        console.log(`[DEBUG] Saving session to database`);
        await session.save();

        console.log(`[DEBUG] Creating UserPracticeHistory record`, {
            userId: session.userId,
            practiceSessionId: session.practiceSessionId,
            scenarioId: session.scenarioId,
            startTime: session.startTime,
            completedAt: completionTime,
        });
        
        await UserPracticeHistory.create({
            userId: session.userId,
            practiceSessionId: session.practiceSessionId,
            scenarioId: session.scenarioId,
            startTime: session.startTime,
            completedAt: completionTime,
            score: null, 
        });
        
        console.log(`[DEBUG] UserPracticeHistory created successfully`);

        // AI 평가를 대기열에 추가 (즉시 실행하지 않음)
        const evaluationTask = {
            sessionId: sessionId,
            execute: async () => {
                const [chatLogs, scenario] = await Promise.all([
                    ChatLog.findAll({ where: { practiceSessionId: sessionId }, order: [['createdAt', 'ASC']] }),
                    Scenario.findByPk(session.scenarioId),
                ]);
                const evaluationData = await aiService.evaluatePracticeSession({ chatLogs, scenario });
                
                // Section-wise performanceByCriteria calculation
                let performanceByCriteria = null;
                if (evaluationData && Array.isArray(evaluationData.checklistResults)) {
                    const fs = require('fs');
                    const path = require('path');
                    const yaml = require('js-yaml');
                    let checklistFileContent = '';
                    if (scenario.checklistFilePath) {
                        try {
                            checklistFileContent = fs.readFileSync(path.join(__dirname, '..', '..', scenario.checklistFilePath), 'utf8');
                        } catch (error) {
                            checklistFileContent = '';
                        }
                    }
                    let checklist = null;
                    try {
                        checklist = yaml.load(checklistFileContent);
                    } catch (e) {
                        checklist = null;
                    }

                    const itemSectionMap = {};
                    if (checklist && checklist.sections) {
                        for (const section of checklist.sections) {
                            if (section.subsections) {
                                for (const subsection of section.subsections) {
                                    if (subsection.items) {
                                        for (const item of subsection.items) {
                                            const cleanItem = item.replace(/^\[\s*\]\s*/, '').trim();
                                            itemSectionMap[cleanItem] = section.name;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    const sectionStats = {};
                    let total = 0, performed = 0;

                    for (const result of evaluationData.checklistResults) {
                        const itemText = result.itemText || result.content || '';
                        const section = itemSectionMap[itemText] || result.nameText || result.section || '기타';
                        if (!sectionStats[section]) sectionStats[section] = { total: 0, performed: 0 };
                        sectionStats[section].total++;
                        total++;
                        if (result.performance === 'yes') {
                            sectionStats[section].performed++;
                            performed++;
                        }
                    }

                    const sections = {};
                    for (const [section, stat] of Object.entries(sectionStats)) {
                        sections[section] = {
                            total: stat.total,
                            performed: stat.performed,
                            rate: stat.total > 0 ? Math.round((stat.performed / stat.total) * 100) : 0
                        };
                    }
                    performanceByCriteria = {
                        overall: {
                            total,
                            performed,
                            rate: total > 0 ? Math.round((performed / total) * 100) : 0
                        },
                        sections
                    };
                }
                
                await EvaluationResult.create({
                    practiceSessionId: sessionId,
                    ...evaluationData,
                    performanceByCriteria
                });
                
                const finalScore = evaluationData.overallScore;
                await session.update({ finalScore: finalScore });
                await UserPracticeHistory.update(
                    { score: finalScore },
                    { where: { practiceSessionId: sessionId } }
                );
            }
        };
        
        console.log(`[DEBUG] Adding evaluation task to queue for session: ${sessionId}`);
        console.log(`📋 세션 ${sessionId} AI 평가를 대기열에 추가`);
        evaluationQueue.push(evaluationTask);
        
        console.log(`[DEBUG] Starting evaluation queue processing`);
        // 대기열 처리 시작 (백그라운드에서 실행)
        setImmediate(() => processEvaluationQueue());

        console.log(`[DEBUG] completePracticeSession completed successfully`);
        return { message: 'Session completed. Evaluation has started.' };
    } catch (error) {
        console.error(`[ERROR] completePracticeSession failed for sessionId=${sessionId}, userId=${userId}:`, error);
        console.error(`[ERROR] Error stack:`, error.stack);
        throw error;
    }
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

const getSessionChatHistory = async (sessionId, userId) => {
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
  setChatHistory(sessionId, history);
  return chatLogs;
};

module.exports = {
  startPracticeSession,
  sendMessageAndGetResponse,
  completePracticeSession,
  getSessionDetails,
  getPracticeSessionFeedback,
  getSessionChatHistory,
  evaluationQueue,
  processEvaluationQueue,
};