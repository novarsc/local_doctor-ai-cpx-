/**
 * @file user.controller.js
 * @description Controller for user-related API requests.
 */

const userService = require('../services/user.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

/**
 * Handles the request to get the current logged-in user's profile.
 */
const getMyProfile = asyncHandler(async (req, res) => {
  // 인증 미들웨어(verifyToken)가 req.user 객체에 사용자 정보를 넣어줍니다.
  const userId = req.user.userId;
  const userProfile = await userService.getUserProfile(userId);
  res.status(200).json(userProfile);
});


// --- [추가된 부분] ---
/**
 * Handles the request to get the current logged-in user's statistics.
 */
const getUserStats = asyncHandler(async (req, res) => {
  // authMiddleware를 통과했으므로 req.user.userId 로 접근 가능
  const userId = req.user.userId; 
  const stats = await userService.calculateUserStats(userId);
  res.status(200).json(stats);
});
// --- [여기까지 추가] ---


module.exports = {
  getMyProfile,
  getUserStats, // 추가
};