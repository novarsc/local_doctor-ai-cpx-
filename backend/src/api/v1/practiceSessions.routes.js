/**
 * @file practiceSessions.routes.js
 * @description Defines API routes for practice sessions.
 */

const express = require('express');
const practiceSessionController = require('../../controllers/practiceSession.controller');
// const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

// All routes here should be protected
// router.use(authMiddleware);

// POST /api/v1/practice-sessions - Start a new practice session
router.post('/', practiceSessionController.createSession);

// POST /api/v1/practice-sessions/:sessionId/chat-messages - Send a message and get a stream response
router.post('/:sessionId/chat-messages', practiceSessionController.handleChatMessage);

// POST /api/v1/practice-sessions/:sessionId/complete - Complete a session and trigger evaluation
router.post('/:sessionId/complete', practiceSessionController.completeSession);

// GET /api/v1/practice-sessions/:sessionId/feedback - Get evaluation results for a session
router.get('/:sessionId/feedback', practiceSessionController.getFeedback);

module.exports = router;
