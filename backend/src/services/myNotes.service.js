/**
 * @file myNotes.service.js
 * @description Business logic for features under "학습 노트".
 */

// --- [수정된 부분] ---
// require('../models') 에서 sequelize 객체를 함께 가져오도록 수정
const { UserBookmarkedScenario, Scenario, IncorrectAnswerNote, EvaluationResult, PracticeSession, MockExamSession, UserPracticeHistory, ChatLog, sequelize } = require('../models');
// --- [여기까지 수정] ---
const { Op } = require('sequelize');


const getBookmarkedScenarios = async (userId) => {
    const bookmarks = await UserBookmarkedScenario.findAll({
        where: { userId },
        include: [{ model: Scenario, as: 'scenario', required: true }],
        order: [['createdAt', 'DESC']]
    });
    return bookmarks.map(bookmark => bookmark.scenario.toJSON());
};

const getIncorrectNotesForScenario = async (userId, scenarioId) => {
    const practiceSessions = await PracticeSession.findAll({ 
        where: { userId, scenarioId, status: 'completed' }, 
        attributes: ['practiceSessionId', 'finalScore', 'endTime'],
        order: [['endTime', 'DESC']]
    });
    
    if (practiceSessions.length === 0) {
        return { 
            aiGeneratedFeedback: [], 
            userMemo: '',
            score: null,
            qualitativeFeedback: '',
            hasNote: false
        };
    }

    const latestSession = practiceSessions[0];
    const sessionIds = practiceSessions.map(s => s.practiceSessionId);
    
    const evaluations = await EvaluationResult.findAll({ 
        where: { practiceSessionId: sessionIds }, 
        attributes: ['improvementAreas', 'qualitativeFeedback', 'overallScore', 'createdAt'],
        order: [['createdAt', 'DESC']]
    });
    
    const userNote = await IncorrectAnswerNote.findOne({ where: { userId, scenarioId } });
    
    const latestEvaluation = evaluations[0];
    const aiFeedback = evaluations.map(e => e.improvementAreas).flat().filter(Boolean);
    
    return { 
        aiGeneratedFeedback: aiFeedback, 
        userMemo: userNote ? userNote.userMemo : '',
        score: latestSession.finalScore || (latestEvaluation ? latestEvaluation.overallScore : null),
        qualitativeFeedback: latestEvaluation ? latestEvaluation.qualitativeFeedback : '',
        hasNote: !!userNote,
        completedAt: latestSession.endTime
    };
};

const getDetailedIncorrectNotes = async (userId, scenarioId) => {
    const practiceSessions = await PracticeSession.findAll({ 
        where: { userId, scenarioId, status: 'completed' }, 
        attributes: ['practiceSessionId', 'finalScore', 'endTime'],
        order: [['endTime', 'DESC']]
    });
    
    if (practiceSessions.length === 0) {
        throw new Error('No completed practice sessions found for this scenario');
    }

    const latestSession = practiceSessions[0];
    const sessionId = latestSession.practiceSessionId;
    
    // 채팅 기록 가져오기
    const chatLogs = await ChatLog.findAll({
        where: { practiceSessionId: sessionId },
        order: [['createdAt', 'ASC']],
        attributes: ['sender', 'message', 'createdAt']
    });
    
    // 평가 결과 가져오기
    const evaluation = await EvaluationResult.findOne({
        where: { practiceSessionId: sessionId }
    });
    
    // 사용자 메모 가져오기
    const userNote = await IncorrectAnswerNote.findOne({ 
        where: { userId, scenarioId },
        attributes: ['userMemo', 'hasNote']
    });
    
    return {
        chatHistory: chatLogs.map(log => ({
            sender: log.sender === 'USER' ? 'user' : 'ai',
            message: log.message,
            timestamp: log.createdAt
        })),
        evaluation: evaluation ? {
            overallScore: evaluation.overallScore,
            qualitativeFeedback: evaluation.qualitativeFeedback,
            checklistResults: evaluation.checklistResults || [],
            goodPoints: evaluation.goodPoints || [],
            improvementAreas: evaluation.improvementAreas || []
        } : null,
        userMemo: userNote ? userNote.userMemo : '',
        hasNote: !!userNote,
        completedAt: latestSession.endTime
    };
};

const upsertUserIncorrectNote = async (userId, scenarioId, userMemo, hasNote = true) => {
    const [note] = await IncorrectAnswerNote.upsert({ 
        userId, 
        scenarioId, 
        userMemo,
        hasNote 
    });
    return note.toJSON();
};

const updateNoteStatus = async (userId, scenarioId, hasNote) => {
    const existingNote = await IncorrectAnswerNote.findOne({ 
        where: { userId, scenarioId },
        attributes: ['userMemo']
    });
    
    const [note] = await IncorrectAnswerNote.upsert({ 
        userId, 
        scenarioId, 
        hasNote,
        userMemo: existingNote ? existingNote.userMemo : '' // 기존 메모 유지
    });
    return note.toJSON();
};

const getLearningHistory = async (userId) => {
    // 증례 실습 기록 가져오기 (모의고사에서 실습한 것은 제외)
    const practiceHistory = await UserPracticeHistory.findAll({
        where: { userId },
        include: [
            { model: Scenario, as: 'scenario', attributes: ['name'] },
            { model: PracticeSession, as: 'practiceSession', attributes: ['finalScore', 'practiceMode', 'mockExamSessionId'] }
        ],
        order: [['completedAt', 'DESC']]
    });

    // 모의고사 기록 가져오기
    const mockExamHistory = await MockExamSession.findAll({
        where: { 
            userId, 
            status: 'completed' 
        },
        order: [['endTime', 'DESC']]
    });

    // 증례 실습 기록 변환 (모의고사에서 실습한 것은 제외)
    const practiceRecords = practiceHistory
        .filter(h => !h.practiceSession?.mockExamSessionId) // 모의고사에서 실습한 것은 제외
        .map(h => ({
            id: h.practiceSessionId,
            type: '증례 실습',
            name: h.scenario.name,
            completedAt: h.completedAt,
            score: h.practiceSession?.finalScore || h.score
        }));

    // 모의고사 기록 변환
    const mockExamRecords = mockExamHistory.map(session => ({
        id: session.mockExamSessionId,
        type: '모의고사',
        name: `모의고사 (${session.examType === 'random' ? '랜덤' : '지정'})`,
        completedAt: session.endTime,
        score: session.overallScore,
        examType: session.examType
    }));

    // 모든 기록을 완료일 기준으로 정렬하여 반환
    const allRecords = [...practiceRecords, ...mockExamRecords];
    return allRecords.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
};

const getPracticedScenarios = async (userId) => {
    const practiceSessions = await PracticeSession.findAll({
        where: { userId, status: 'completed' },
        include: [
            { model: Scenario, as: 'scenario', attributes: ['scenarioId', 'name'] },
            { model: EvaluationResult, as: 'evaluationResult', attributes: ['overallScore', 'qualitativeFeedback'] },
            { model: IncorrectAnswerNote, as: 'incorrectAnswerNote', attributes: ['hasNote'] }
        ],
        order: [['endTime', 'DESC']]
    });

    return practiceSessions.map(session => ({
        scenarioId: session.scenarioId,
        name: session.scenario.name,
        score: session.finalScore || (session.evaluationResult ? session.evaluationResult.overallScore : null),
        qualitativeFeedback: session.evaluationResult ? session.evaluationResult.qualitativeFeedback : '',
        hasNote: session.incorrectAnswerNote ? session.incorrectAnswerNote.hasNote : false,
        completedAt: session.endTime
    }));
};

// 모의고사 세션의 개별 증례들을 가져오는 새로운 함수
const getMockExamCases = async (userId, mockExamSessionId) => {
    const mockExamSession = await MockExamSession.findOne({
        where: { 
            mockExamSessionId, 
            userId, 
            status: 'completed' 
        }
    });

    if (!mockExamSession) {
        throw new Error('Mock exam session not found');
    }

    // 각 증례의 실습 세션 정보를 가져오기
    const caseDetails = await Promise.all(
        mockExamSession.selectedScenariosDetails.map(async (caseDetail, index) => {
            let practiceSession = null;
            let evaluationResult = null;

            if (caseDetail.practiceSessionId) {
                practiceSession = await PracticeSession.findOne({
                    where: { practiceSessionId: caseDetail.practiceSessionId },
                    include: [
                        { model: EvaluationResult, as: 'evaluationResult', attributes: ['overallScore', 'qualitativeFeedback'] }
                    ]
                });
                
                if (practiceSession) {
                    evaluationResult = practiceSession.evaluationResult;
                }
            }

            return {
                caseNumber: index + 1,
                scenarioId: caseDetail.scenarioId,
                name: caseDetail.name,
                age: caseDetail.age,
                sex: caseDetail.sex,
                presentingComplaint: caseDetail.presentingComplaint,
                primaryCategory: caseDetail.primaryCategory,
                secondaryCategory: caseDetail.secondaryCategory,
                practiceSessionId: caseDetail.practiceSessionId,
                score: caseDetail.score || (evaluationResult ? evaluationResult.overallScore : null),
                qualitativeFeedback: evaluationResult ? evaluationResult.qualitativeFeedback : '',
                completedAt: practiceSession ? practiceSession.endTime : null
            };
        })
    );

    return {
        mockExamSessionId: mockExamSession.mockExamSessionId,
        examType: mockExamSession.examType,
        overallScore: mockExamSession.overallScore,
        startTime: mockExamSession.startTime,
        endTime: mockExamSession.endTime,
        cases: caseDetails
    };
};

module.exports = {
    getBookmarkedScenarios,
    getIncorrectNotesForScenario,
    getDetailedIncorrectNotes,
    upsertUserIncorrectNote,
    updateNoteStatus,
    getLearningHistory,
    getPracticedScenarios,
    getMockExamCases,
};