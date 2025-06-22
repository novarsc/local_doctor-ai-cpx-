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

/**
 * Handles the request to update the current logged-in user's profile.
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const profileData = req.body;
  const updatedProfile = await userService.updateUserProfile(userId, profileData);
  res.status(200).json(updatedProfile);
});

/**
 * Handles the request to update the current logged-in user's password.
 */
const updateMyPassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;
  await userService.updateUserPassword(userId, currentPassword, newPassword);
  res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
});

/**
 * Handles the request to upload profile image.
 */
const uploadProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  if (!req.file) {
    return res.status(400).json({
      error: '프로필 이미지 파일이 필요합니다.'
    });
  }

  const updatedProfile = await userService.uploadProfileImage(userId, req.file);
  res.status(200).json(updatedProfile);
});

/**
 * Handles the request to delete profile image.
 */
const deleteProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const updatedProfile = await userService.deleteProfileImage(userId);
  res.status(200).json(updatedProfile);
});

/**
 * Handles the request to delete the current logged-in user's account.
 */
const deleteMyAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      error: '본인 확인을 위해 비밀번호가 필요합니다.'
    });
  }

  await userService.deleteUserAccount(userId, password);
  res.status(200).json({ message: '계정이 성공적으로 삭제되었습니다.' });
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
  updateMyProfile,
  updateMyPassword,
  uploadProfileImage,
  deleteProfileImage,
  deleteMyAccount,
  getUserStats, // 추가
};