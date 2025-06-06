/**
 * @file mockExams.routes.js
 * @description Defines API routes for mock exams.
 */

const express = require('express');
const mockExamController = require('../../controllers/mockExam.controller');
// const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

// All routes here should be protected
// router.use(authMiddleware);

// POST /api/v1/mock-exams - Start a new mock exam session
router.post('/', mockExamController.startSession);

// GET /api/v1/mock-exams/:mockExamSessionId - Get details of a specific mock exam session
router.get('/:mockExamSessionId', mockExamController.getSession);

// POST /api/v1/mock-exams/:mockExamSessionId/complete - Complete a mock exam session
router.post('/:mockExamSessionId/complete', mockExamController.completeSession);

module.exports = router;
