/**
 * @file myNotes.routes.js
 * @description Defines API routes for "MY 노트" features.
 */

const express = require('express');
const myNotesController = require('../../controllers/myNotes.controller');
// 1. 인증 미들웨어를 가져옵니다.
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

// 2. "MY 노트"의 모든 기능은 로그인한 사용자만 사용 가능하므로,
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
router.put('/incorrect-notes/:scenarioId', myNotesController.saveIncorrectNoteMemo);
router.get('/history', myNotesController.getHistory);

module.exports = router;