/**
 * @file auth.controller.js
 * @description Authentication controller (Handler Layer)
 * Handles HTTP requests related to authentication (register, login).
 */

const authService = require('../services/auth.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

/**
 * Handles user registration request.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const register = asyncHandler(async (req, res) => {
  // The validator middleware will have already checked the body.
  const userData = req.body;
  const newUser = await authService.registerUser(userData);
  
  // As per API spec 2.1.1
  res.status(201).json(newUser);
});

/**
 * Handles user login request.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);

  // As per API spec 2.1.2, return tokens and user info
  res.status(200).json(result);
});

/**
 * 네이버 소셜 로그인 처리
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const naverLogin = asyncHandler(async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      error: '네이버 인증 코드가 필요합니다.',
    });
  }

  const result = await authService.naverLogin(code);
  res.status(200).json(result);
});

/**
 * 카카오 소셜 로그인 처리
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const kakaoLogin = asyncHandler(async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      error: '카카오 인증 코드가 필요합니다.',
    });
  }

  const result = await authService.kakaoLogin(code);
  res.status(200).json(result);
});

/**
 * 아이디 찾기 처리
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const findId = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: '이메일 주소가 필요합니다.',
    });
  }

  const result = await authService.findUserId(email);
  res.status(200).json(result);
});

/**
 * 비밀번호 찾기 처리
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const findPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: '이메일 주소가 필요합니다.',
    });
  }

  const result = await authService.findUserPassword(email);
  res.status(200).json(result);
});

/**
 * 비밀번호 재설정 처리
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({
      error: '토큰과 새 비밀번호가 필요합니다.',
    });
  }

  const result = await authService.resetPassword(token, newPassword);
  res.status(200).json(result);
});

/**
 * 토큰 갱신 처리
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      error: 'Refresh token이 필요합니다.',
    });
  }

  const result = await authService.refreshToken(refreshToken);
  res.status(200).json(result);
});

module.exports = {
  register,
  login,
  naverLogin,
  kakaoLogin,
  findId,
  findPassword,
  resetPassword,
  refreshToken,
};
