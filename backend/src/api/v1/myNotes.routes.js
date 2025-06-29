/**
 * @file myNotes.routes.js
 * @description Defines API routes for "학습 노트" features.
 * 
 * @author [Your Name]
 * @version 1.0.0
 * 
 * @description
 * 1. 이 파일은 "학습 노트" 기능과 관련된 모든 API 엔드포인트를 정의합니다.
 * 2. "학습 노트"의 모든 기능은 로그인한 사용자만 사용 가능하므로,
 */

const express = require('express');
const myNotesController = require('../../controllers/myNotes.controller');
// 1. 인증 미들웨어를 가져옵니다.
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

// 2. "학습 노트"의 모든 기능은 로그인한 사용자만 사용 가능하므로,
// router.use()를 사용해 이 파일의 모든 라우트에 미들웨어를 일괄 적용합니다.
router.use(verifyToken);

// --- [추가된 부분] ---
/**
 * @route   GET /api/v1/my-notes/practiced-scenarios
 * @desc    Get a list of scenarios the user has practiced
 * @access  Private
 */
router.get('/practiced-scenarios', myNotesController.getPracticedScenarios);
// --- [여기까지 추가] ---

router.get('/bookmarks', myNotesController.getBookmarks);
router.get('/incorrect-notes/:scenarioId', myNotesController.getIncorrectNotes);

// --- [새로 추가된 부분] ---
/**
 * @route   GET /api/v1/my-notes/incorrect-notes/:scenarioId/detail
 * @desc    Get detailed incorrect notes including chat history and evaluation
 * @access  Private
 */
router.get('/incorrect-notes/:scenarioId/detail', myNotesController.getDetailedIncorrectNotes);

/**
 * @route   PATCH /api/v1/my-notes/incorrect-notes/:scenarioId/status
 * @desc    Update the note status (hasNote flag)
 * @access  Private
 */
router.patch('/incorrect-notes/:scenarioId/status', myNotesController.updateNoteStatus);
// --- [여기까지 추가] ---

router.put('/incorrect-notes/:scenarioId', myNotesController.saveIncorrectNoteMemo);
router.get('/history', myNotesController.getHistory);

module.exports = router;