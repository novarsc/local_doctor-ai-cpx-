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
    const history = await UserPracticeHistory.findAll({
        where: { userId },
        include: [
            { model: Scenario, as: 'scenario', attributes: ['name'] },
            { model: PracticeSession, as: 'practiceSession', attributes: ['finalScore'] }
        ],
        order: [['completedAt', 'DESC']]
    });
    return history.map(h => ({
        id: h.practiceSessionId,
        type: '증례 실습',
        name: h.scenario.name,
        completedAt: h.completedAt,
        score: h.practiceSession?.finalScore || h.score
    }));
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

module.exports = {
    getBookmarkedScenarios,
    getIncorrectNotesForScenario,
    getDetailedIncorrectNotes,
    upsertUserIncorrectNote,
    updateNoteStatus,
    getLearningHistory,
    getPracticedScenarios,
};