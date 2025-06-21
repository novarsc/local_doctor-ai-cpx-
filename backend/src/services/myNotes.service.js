/**
 * @file myNotes.service.js
 * @description Business logic for features under "MY 노트".
 */

// --- [수정된 부분] ---
// require('../models') 에서 sequelize 객체를 함께 가져오도록 수정
const { UserBookmarkedScenario, Scenario, IncorrectAnswerNote, EvaluationResult, PracticeSession, MockExamSession, UserPracticeHistory, sequelize } = require('../models');
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
        completedAt: p.endTime,
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

const getPracticedScenarios = async (userId) => {
    console.log(`[DEBUG] Getting practiced scenarios for user: ${userId}`);
    // 1. UserPracticeHistory에서 해당 사용자의 모든 기록을 가져옵니다.
    const histories = await UserPracticeHistory.findAll({
        where: { userId },
        include: [{ model: Scenario, as: 'scenario' }], // 관련된 Scenario 정보를 함께 가져옵니다.
        order: [['completedAt', 'DESC']], // 최근 완료 순으로 정렬
    });

    console.log(`[DEBUG] Found ${histories.length} practice histories.`);

    // 2. 중복된 증례를 제거하고 최신 기록만 남깁니다.
    const uniqueScenarios = [];
    const seenScenarioIds = new Set();

    for (const history of histories) {
        if (history.scenario && !seenScenarioIds.has(history.scenario.scenarioId)) {
            uniqueScenarios.push(history.scenario);
            seenScenarioIds.add(history.scenario.scenarioId);
        }
    }
    
    console.log(`[DEBUG] Returning ${uniqueScenarios.length} unique scenarios.`);
    return uniqueScenarios;
};


module.exports = {
  getBookmarkedScenarios,
  getIncorrectNotesForScenario,
  upsertUserIncorrectNote,
  getLearningHistory,
  getPracticedScenarios,
};