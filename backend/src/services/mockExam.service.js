/**
 * @file mockExam.service.js
 * @description Business logic for handling mock exams.
 */

const { Scenario, MockExamSession, PracticeSession } = require('../models');
const { fn, col } = require('sequelize');
const ApiError = require('../utils/ApiError');

// startMockExamSession and getMockExamSession functions remain unchanged...
const startMockExamSession = async (userId, examType, specifiedCategories = []) => {
    const scenarios = await Scenario.findAll();
    const scenariosByPrimaryCategory = scenarios.reduce((acc, scenario) => {
        (acc[scenario.primaryCategory] = acc[scenario.primaryCategory] || []).push(scenario);
        return acc;
    }, {});
    const allPrimaryCategories = Object.keys(scenariosByPrimaryCategory);
    if (allPrimaryCategories.length < 6) throw new ApiError(500, 'M001_INSUFFICIENT_SCENARIOS', 'Not enough scenarios to create a mock exam.');
    let selectedScenarios = [];
    const chosenPrimaryCategories = allPrimaryCategories.sort(() => 0.5 - Math.random()).slice(0, 6);
    chosenPrimaryCategories.forEach(category => {
        const scenariosInCat = scenariosByPrimaryCategory[category];
        selectedScenarios.push(scenariosInCat[Math.floor(Math.random() * scenariosInCat.length)]);
    });
    const selectedScenariosDetails = selectedScenarios.map(s => ({
        scenarioId: s.scenarioId, name: s.name, primaryCategory: s.primaryCategory, secondaryCategory: s.secondaryCategory, practiceSessionId: null, score: null,
    }));
    const newMockExamSession = await MockExamSession.create({ userId, examType, status: 'started', selectedScenariosDetails });
    return newMockExamSession.toJSON();
};
const getMockExamSession = async (mockExamSessionId, userId) => {
    const session = await MockExamSession.findOne({ where: { mockExamSessionId, userId } });
    if (!session) throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found or access denied.');
    return session.toJSON();
};

/**
 * Completes a mock exam session.
 * This might involve calculating the final overall score.
 * @param {string} mockExamSessionId - The ID of the mock exam session.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} The completed mock exam session object.
 */
const completeMockExamSession = async (mockExamSessionId, userId) => {
    const session = await MockExamSession.findOne({ where: { mockExamSessionId, userId } });
    if (!session) throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found.');

    // In a real application, you would fetch the scores from the associated PracticeSessions,
    // which are created during the mock exam. For now, we'll just mark it as complete.
    const scores = session.selectedScenariosDetails.map(s => s.score).filter(s => s !== null);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    session.status = 'completed';
    session.endTime = new Date();
    session.overallScore = overallScore;
    
    await session.save();

    return session.toJSON();
};

module.exports = {
  startMockExamSession,
  getMockExamSession,
  completeMockExamSession,
};
