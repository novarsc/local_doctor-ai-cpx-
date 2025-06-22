/**
 * @file mockExams.routes.js
 * @description Defines API routes for mock exams.
 */

const express = require('express');
const mockExamController = require('../../controllers/mockExam.controller');
// 1. 인증 미들웨어를 가져옵니다.
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

// 2. 이 파일의 모든 라우트에 verifyToken 미들웨어를 적용하여,
// 이후의 모든 요청(req)에 사용자 정보(req.user)가 포함되도록 합니다.
router.use(verifyToken);

// POST /api/v1/mock-exams - Start a new mock exam session
router.post('/', mockExamController.startSession);

// GET /api/v1/mock-exams/categories - Get secondary categories
router.get('/categories', mockExamController.getSecondaryCategories);

// GET /api/v1/mock-exams/:mockExamSessionId - Get details of a specific mock exam session
router.get('/:mockExamSessionId', mockExamController.getSession);

// POST /api/v1/mock-exams/:mockExamSessionId/complete - Complete a mock exam session
router.post('/:mockExamSessionId/complete', mockExamController.completeSession);

// POST /api/v1/mock-exams/:mockExamSessionId/cases/:caseNumber/start - Start practice session for a specific case in mock exam
router.post('/:mockExamSessionId/cases/:caseNumber/start', mockExamController.startCasePractice);

module.exports = router;