/**
 * @file validation.middleware.js
 * @description 입력 검증을 위한 미들웨어와 스키마 정의
 */

const { body, validationResult } = require('express-validator');

/**
 * 검증 결과를 처리하는 미들웨어
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Failed',
      message: '입력 데이터가 유효하지 않습니다.',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * 회원가입 검증 스키마
 */
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력하세요')
    .isLength({ max: 255 })
    .withMessage('이메일은 255자를 초과할 수 없습니다'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('비밀번호는 8자 이상 128자 이하여야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('비밀번호는 대소문자, 숫자, 특수문자를 모두 포함해야 합니다'),
  
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('이름은 2자 이상 100자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 포함할 수 있습니다'),
  
  body('nickname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('닉네임은 2자 이상 50자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z0-9_]+$/)
    .withMessage('닉네임은 한글, 영문, 숫자, 언더스코어만 포함할 수 있습니다'),
  
  handleValidationErrors
];

/**
 * 로그인 검증 스키마
 */
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력하세요')
    .isLength({ max: 255 })
    .withMessage('이메일은 255자를 초과할 수 없습니다'),
  
  body('password')
    .isLength({ min: 1, max: 128 })
    .withMessage('비밀번호를 입력하세요'),
  
  handleValidationErrors
];

/**
 * 소셜 로그인 검증 스키마
 */
const socialLoginValidation = [
  body('code')
    .isLength({ min: 1, max: 1000 })
    .withMessage('인증 코드가 필요합니다')
    .trim(),
  
  handleValidationErrors
];

/**
 * 이메일 검증 스키마
 */
const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력하세요')
    .isLength({ max: 255 })
    .withMessage('이메일은 255자를 초과할 수 없습니다'),
  
  handleValidationErrors
];

/**
 * 비밀번호 재설정 검증 스키마
 */
const resetPasswordValidation = [
  body('token')
    .isLength({ min: 1, max: 255 })
    .withMessage('재설정 토큰이 필요합니다')
    .trim(),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('새 비밀번호는 8자 이상 128자 이하여야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('새 비밀번호는 대소문자, 숫자, 특수문자를 모두 포함해야 합니다'),
  
  handleValidationErrors
];

/**
 * 토큰 갱신 검증 스키마
 */
const refreshTokenValidation = [
  body('refreshToken')
    .isLength({ min: 1, max: 500 })
    .withMessage('Refresh 토큰이 필요합니다')
    .trim(),
  
  handleValidationErrors
];

/**
 * 일반적인 XSS 방지 및 입력 정제
 */
const sanitizeInput = (req, res, next) => {
  // 요청 본문의 모든 문자열 값에서 HTML 태그 제거
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<[^>]*>/g, '').trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  socialLoginValidation,
  emailValidation,
  resetPasswordValidation,
  refreshTokenValidation,
  sanitizeInput,
  handleValidationErrors
}; 