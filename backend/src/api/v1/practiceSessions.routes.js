/**
 * @file practiceSessions.routes.js
 * @description Defines API routes for practice sessions.
 */

const express = require('express');
const practiceSessionController = require('../../controllers/practiceSession.controller');
// 1. 인증 미들웨어를 가져옵니다.
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

// 2. 실습 세션 관련 모든 기능도 로그인 사용자만 사용 가능합니다.
router.use(verifyToken);

router.post('/', practiceSessionController.createSession);
router.get('/:sessionId', practiceSessionController.getSessionDetails);
router.post('/:sessionId/chat-messages', practiceSessionController.handleChatMessage);
router.get('/:sessionId/chat-messages', practiceSessionController.getChatMessages);
router.post('/:sessionId/complete', practiceSessionController.completeSession);
router.get('/:sessionId/feedback', practiceSessionController.getFeedback);
router.get('/:sessionId/history', practiceSessionController.getChatHistory);


module.exports = router;
