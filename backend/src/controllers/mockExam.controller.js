/**
 * @file mockExam.controller.js
 * @description Controller for mock exam related API requests.
 */

const mockExamService = require('../services/mockExam.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// startSession and getSession functions remain unchanged...
const startSession = asyncHandler(async (req, res) => {
    const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    const { examType, specifiedCategories } = req.body;
    const result = await mockExamService.startMockExamSession(userId, examType, specifiedCategories);
    res.status(201).json(result);
});
const getSession = asyncHandler(async (req, res) => {
    const { mockExamSessionId } = req.params;
    const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    const result = await mockExamService.getMockExamSession(mockExamSessionId, userId);
    res.status(200).json(result);
});

/**
 * Handles the request to complete a mock exam session.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const completeSession = asyncHandler(async (req, res) => {
    const { mockExamSessionId } = req.params;
    const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Placeholder User ID

    const result = await mockExamService.completeMockExamSession(mockExamSessionId, userId);

    res.status(200).json(result);
});


module.exports = {
    startSession,
    getSession,
    completeSession,
};
