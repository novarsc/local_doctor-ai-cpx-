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

module.exports = {
  getMyProfile,
};
