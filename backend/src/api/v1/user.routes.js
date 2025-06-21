/**
 * @file user.routes.js
 * @description Defines API routes for user-related actions.
 */

const express = require('express');
const userController = require('../../controllers/user.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

// GET /api/v1/users/me - 내 정보 조회
// 이 라우트는 로그인이 필요한 보호된 라우트입니다.
router.get('/me', verifyToken, userController.getMyProfile);

// --- [추가된 부분] ---
/**
 * @route   GET /api/v1/users/me/stats
 * @desc    Get my learning statistics
 * @access  Private
 */
router.get('/me/stats', verifyToken, userController.getUserStats);
// --- [여기까지 추가] ---


// 향후 사용자 프로필 수정(PUT /me)과 같은 다른 라우트도 여기에 추가할 수 있습니다.

module.exports = router;