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

const completePracticeSession = async (sessionId, userId) => {
    console.log(`[DEBUG] completePracticeSession called: sessionId=${sessionId}, userId=${userId}`);
    
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

    updateChatHistory(sessionId, []);
    
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
            // --- Section-wise performanceByCriteria calculation ---
            let performanceByCriteria = null;
            if (evaluationData && Array.isArray(evaluationData.checklistResults)) {
                // 1. Load checklist YAML structure
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
                // 2. Build itemText -> sectionName map
                const itemSectionMap = {};
                if (checklist && Array.isArray(checklist.sections)) {
                    for (const section of checklist.sections) {
                        // Subsections (if present)
                        if (Array.isArray(section.subsections)) {
                            for (const subsection of section.subsections) {
                                if (Array.isArray(subsection.items)) {
                                    for (const item of subsection.items) {
                                        itemSectionMap[item] = section.name;
                                    }
                                }
                            }
                        }
                        // Direct items (if present)
                        if (Array.isArray(section.items)) {
                            for (const item of section.items) {
                                itemSectionMap[item] = section.name;
                            }
                        }
                    }
                } else if (checklist && checklist.checklist && Array.isArray(checklist.checklist.sections)) {
                    // 새로운 체크리스트 구조 처리
                    for (const section of checklist.checklist.sections) {
                        const sectionName = section.title_kr || section.title_en || "미분류";
                        
                        if (Array.isArray(section.items)) {
                            for (const item of section.items) {
                                if (item.details) {
                                    // details 필드에서 체크리스트 항목들을 추출
                                    const lines = item.details.split('\n');
                                    for (const line of lines) {
                                        // "- [ ]" 패턴으로 시작하는 체크리스트 항목 찾기
                                        const match = line.match(/^\s*-\s*\[\s*\]\s*(.+?)(?:\s*\([^)]+\))?\s*$/);
                                        if (match) {
                                            // 한국어 부분만 추출 (영어 번역 제거)
                                            let cleanText = match[1].trim();
                                            const koreanMatch = cleanText.match(/^([^(]+?)(?:\s*\([^)]+\))?\s*$/);
                                            if (koreanMatch) {
                                                cleanText = koreanMatch[1].trim();
                                            }
                                            itemSectionMap[cleanText] = sectionName;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // 3. Section-wise count
                const sectionStats = {};
                let total = 0, performed = 0;
                for (const result of evaluationData.checklistResults) {
                    // itemText 또는 content 필드를 사용하여 섹션 매핑
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
                // 4. Calculate rates
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
                performanceByCriteria // always include this field
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
  getSessionDetails, // [수정] exports에 추가
  getPracticeSessionFeedback,
  getSessionChatHistory,
};