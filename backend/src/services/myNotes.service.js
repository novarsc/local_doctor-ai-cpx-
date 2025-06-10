/**
 * @file myNotes.service.js
 * @description Business logic for features under "MY 노트".
 */

const { UserBookmarkedScenario, Scenario, IncorrectAnswerNote, EvaluationResult, PracticeSession, MockExamSession } = require('../models');

const getBookmarkedScenarios = async (userId) => {
    const bookmarks = await UserBookmarkedScenario.findAll({
        where: { userId },
        include: [{ model: Scenario, as: 'scenario', required: true }],
        order: [['createdAt', 'DESC']]
    });
    return bookmarks.map(bookmark => bookmark.scenario.toJSON());
};

const getIncorrectNotesForScenario = async (userId, scenarioId) => {
    const practiceSessions = await PracticeSession.findAll({ where: { userId, scenarioId, status: 'completed' }, attributes: ['practiceSessionId']});
    const sessionIds = practiceSessions.map(s => s.practiceSessionId);
    const evaluations = await EvaluationResult.findAll({ where: { practiceSessionId: sessionIds }, attributes: ['improvementAreas', 'createdAt']});
    const aiFeedback = evaluations.map(e => e.improvementAreas).flat().filter(Boolean);
    const userNote = await IncorrectAnswerNote.findOne({ where: { userId, scenarioId } });
    return { aiGeneratedFeedback: aiFeedback, userMemo: userNote ? userNote.userMemo : '' };
};

const upsertUserIncorrectNote = async (userId, scenarioId, userMemo) => {
    const [note] = await IncorrectAnswerNote.upsert({ userId, scenarioId, userMemo });
    return note.toJSON();
};

const getLearningHistory = async (userId) => {
    const casePractices = await PracticeSession.findAll({
        where: {
            userId,
            status: 'completed',
        },
        include: [{ model: Scenario, as: 'scenario', attributes: ['name'] }],
        // 1. 정렬 기준 컬럼을 'completedAt'에서 'endTime'으로 수정합니다.
        order: [['endTime', 'DESC']],
    });

    const mockExams = await MockExamSession.findAll({
        where: { userId, status: 'completed' },
        order: [['endTime', 'DESC']],
    });

    const formattedPractices = casePractices.map(p => ({
        type: '증례 실습',
        id: p.practiceSessionId,
        scenarioId: p.scenarioId,
        name: p.scenario.name, 
        completedAt: p.endTime, // 여기는 p.endTime을 사용하는 것이 맞습니다.
        score: p.finalScore,
    }));
    
    const formattedMockExams = mockExams.map(m => ({
        type: '모의고사',
        id: m.mockExamSessionId,
        name: `모의고사 (${new Date(m.startTime).toLocaleDateString()})`,
        completedAt: m.endTime,
        score: m.overallScore,
    }));
    
    const combinedHistory = [...formattedPractices, ...formattedMockExams];

    combinedHistory.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return combinedHistory;
};

module.exports = {
  getBookmarkedScenarios,
  getIncorrectNotesForScenario,
  upsertUserIncorrectNote,
  getLearningHistory,
};
