/**
 * @file mockExam.controller.js
 * @description Controller for mock exam related API requests.
 */

const mockExamService = require('../services/mockExam.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

const startSession = asyncHandler(async (req, res) => {
    // 1. 하드코딩된 ID를 삭제하고, req.user 객체에서 실제 사용자 ID를 가져옵니다.
    const userId = req.user.userId;
    const { examType, specifiedCategories } = req.body;
    const result = await mockExamService.startMockExamSession(userId, examType, specifiedCategories);
    res.status(201).json(result);
});

const getSession = asyncHandler(async (req, res) => {
    const { mockExamSessionId } = req.params;
    // 2. 이 부분도 실제 사용자 ID를 사용하도록 변경합니다.
    const userId = req.user.userId;
    const result = await mockExamService.getMockExamSession(mockExamSessionId, userId);
    res.status(200).json(result);
});

const completeSession = asyncHandler(async (req, res) => {
    const { mockExamSessionId } = req.params;
    // 3. 이 부분도 실제 사용자 ID를 사용하도록 변경합니다.
    const userId = req.user.userId;

    const result = await mockExamService.completeMockExamSession(mockExamSessionId, userId);

    res.status(200).json(result);
});


module.exports = {
    startSession,
    getSession,
    completeSession,
};