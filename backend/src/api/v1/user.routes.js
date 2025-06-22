/**
 * @file user.routes.js
 * @description Defines API routes for user-related actions.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const userController = require('../../controllers/user.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Multer 설정 - 프로필 이미지 업로드용
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/profile-images/');
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지를 위해 타임스탬프 추가
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // 이미지 파일만 허용
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

// GET /api/v1/users/me - 내 정보 조회
// 이 라우트는 로그인이 필요한 보호된 라우트입니다.
router.get('/me', verifyToken, userController.getMyProfile);

// PUT /api/v1/users/me/profile - 내 프로필 정보 수정
router.put('/me/profile', verifyToken, userController.updateMyProfile);

// PUT /api/v1/users/me/password - 내 비밀번호 변경
router.put('/me/password', verifyToken, userController.updateMyPassword);

// PUT /api/v1/users/me/profile-image - 프로필 이미지 업로드
router.put('/me/profile-image', verifyToken, upload.single('profileImage'), userController.uploadProfileImage);

// DELETE /api/v1/users/me/profile-image - 프로필 이미지 삭제
router.delete('/me/profile-image', verifyToken, userController.deleteProfileImage);

// DELETE /api/v1/users/me - 계정 삭제
router.delete('/me', verifyToken, userController.deleteMyAccount);

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