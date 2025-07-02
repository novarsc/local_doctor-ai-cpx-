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
    
    // 디버깅을 위한 로그 추가
    console.log('=== MockExam getSession API 호출 ===');
    console.log('mockExamSessionId:', mockExamSessionId);
    console.log('userId:', userId);
    console.log('req.user:', req.user);
    
    const result = await mockExamService.getMockExamSession(mockExamSessionId, userId);
    console.log('=== MockExam getSession 결과 ===');
    console.log('result:', result);
    
    res.status(200).json(result);
});

const completeSession = asyncHandler(async (req, res) => {
    const { mockExamSessionId } = req.params;
    // 3. 이 부분도 실제 사용자 ID를 사용하도록 변경합니다.
    const userId = req.user.userId;

    const result = await mockExamService.completeMockExamSession(mockExamSessionId, userId);

    res.status(200).json(result);
});

const startCasePractice = asyncHandler(async (req, res) => {
    const { mockExamSessionId, caseNumber } = req.params;
    const userId = req.user.userId;
    
    const result = await mockExamService.startCasePracticeSession(mockExamSessionId, parseInt(caseNumber), userId);
    
    res.status(201).json(result);
});

const getCases = asyncHandler(async (req, res) => {
    const result = await mockExamService.getCases();
    res.json({
        success: true,
        data: result
    });
});

const getEvaluationProgress = asyncHandler(async (req, res) => {
    const { mockExamSessionId } = req.params;
    const userId = req.user.userId;
    const progress = await mockExamService.getEvaluationProgress(mockExamSessionId, userId);
    res.status(200).json(progress);
});

module.exports = {
    startSession,
    getSession,
    completeSession,
    startCasePractice,
    getCases,
    getEvaluationProgress
};