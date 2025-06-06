/**
 * @file myNotes.service.js
 * @description Business logic for features under "MY 노트".
 */

const { UserBookmarkedScenario, Scenario, IncorrectAnswerNote, EvaluationResult, PracticeSession, MockExamSession } = require('../models');

// getBookmarkedScenarios, getIncorrectNotesForScenario, upsertUserIncorrectNote functions remain unchanged...
const getBookmarkedScenarios = async (userId) => {
    const bookmarks = await UserBookmarkedScenario.findAll({ where: { userId }, include: [{ model: Scenario, required: true }], order: [['createdAt', 'DESC']] });
    return bookmarks.map(bookmark => bookmark.Scenario.toJSON());
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

/**
 * Fetches the learning history for a user, combining case practices and mock exams.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} A sorted list of learning activities.
 */
const getLearningHistory = async (userId) => {
    // 1. Fetch all completed individual practice sessions
    const casePractices = await PracticeSession.findAll({
        where: {
            userId,
            status: 'completed',
            // Exclude sessions that are part of a mock exam if they are linked
        },
        include: [{ model: Scenario, attributes: ['name'] }],
        order: [['completedAt', 'DESC']],
    });

    // 2. Fetch all completed mock exam sessions
    const mockExams = await MockExamSession.findAll({
        where: { userId, status: 'completed' },
        order: [['endTime', 'DESC']],
    });

    // 3. Format and combine the two lists
    const formattedPractices = casePractices.map(p => ({
        type: '증례 실습',
        id: p.practiceSessionId,
        scenarioId: p.scenarioId,
        name: p.Scenario.name,
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

    // 4. Sort the combined list by completion date
    combinedHistory.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return combinedHistory;
};

module.exports = {
  getBookmarkedScenarios,
  getIncorrectNotesForScenario,
  upsertUserIncorrectNote,
  getLearningHistory,
};
