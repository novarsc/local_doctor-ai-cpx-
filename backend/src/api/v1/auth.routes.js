/**
 * @file auth.routes.js
 * @description Defines API routes for authentication.
 * Maps endpoints to controller functions.
 */

const express = require('express');
const authController = require('../../controllers/auth.controller');
const passport = require('../../config/passport.config');
const {
  registerValidation,
  loginValidation,
  socialLoginValidation,
  emailValidation,
  resetPasswordValidation,
  refreshTokenValidation,
  sanitizeInput
} = require('../../middlewares/validation.middleware');

const router = express.Router();

// 모든 라우트에 입력 정제 미들웨어 적용
router.use(sanitizeInput);

// Route for user registration
// POST /api/v1/auth/register
router.post('/register', registerValidation, authController.register);

// Route for user login
// POST /api/v1/auth/login
router.post('/login', loginValidation, authController.login);

// Social login routes
// POST /api/v1/auth/naver
router.post('/naver', socialLoginValidation, authController.naverLogin);

// POST /api/v1/auth/kakao
router.post('/kakao', socialLoginValidation, authController.kakaoLogin);

// Account recovery routes
// POST /api/v1/auth/find-id
router.post('/find-id', emailValidation, authController.findId);

// POST /api/v1/auth/find-password
router.post('/find-password', emailValidation, authController.findPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);

// Passport 기반 소셜 로그인 라우트
// 네이버 로그인
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  router.get('/naver/login', passport.authenticate('naver'));
  router.get('/naver/callback', 
    passport.authenticate('naver', { failureRedirect: '/api/v1/auth/failure' }),
    authController.socialLoginCallback
  );
} else {
  router.get('/naver/login', (req, res) => {
    res.status(503).json({ 
      error: 'naver_login_not_configured',
      message: '네이버 로그인이 설정되지 않았습니다.' 
    });
  });
  router.get('/naver/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=naver_login_not_configured`);
  });
}

// 구글 로그인
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google/login', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/api/v1/auth/failure' }),
    authController.socialLoginCallback
  );
} else {
  router.get('/google/login', (req, res) => {
    res.status(503).json({ 
      error: 'google_login_not_configured',
      message: '구글 로그인이 설정되지 않았습니다.' 
    });
  });
  router.get('/google/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_login_not_configured`);
  });
}

// 카카오 로그인
if (process.env.KAKAO_CLIENT_ID) {
  router.get('/kakao/login', passport.authenticate('kakao'));
  router.get('/kakao/callback',
    passport.authenticate('kakao', { failureRedirect: '/api/v1/auth/failure' }),
    authController.socialLoginCallback
  );
} else {
  router.get('/kakao/login', (req, res) => {
    res.status(503).json({ 
      error: 'kakao_login_not_configured',
      message: '카카오 로그인이 설정되지 않았습니다.' 
    });
  });
  router.get('/kakao/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=kakao_login_not_configured`);
  });
}

// 소셜 로그인 실패 처리
router.get('/failure', authController.socialLoginFailure);

module.exports = router;
