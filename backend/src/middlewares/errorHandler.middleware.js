/**
 * @file errorHandler.middleware.js
 * @description Global error handling middleware for the Express application.
 */

// ▼▼▼ 이 부분의 코드를 수정합니다. { }가 없는 것이 올바른 방식입니다. ▼▼▼
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of our custom ApiError,
  // convert it to one for a consistent response format.
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred.';
    error = new ApiError(statusCode, 'INTERNAL_SERVER_ERROR', message, false, err.stack);
  }

  // 🪵 개발 환경에서만 상세한 에러 정보를 로깅합니다.
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 An error occurred!');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
    console.error('Request IP:', req.ip);
  } else {
    // 프로덕션에서는 간단한 로깅만
    console.error('Error:', error.message);
    console.error('Request:', req.method, req.originalUrl);
  }

  // 민감한 정보 필터링
  const sanitizedError = {
    code: error.errorCode,
    message: error.message,
    timestamp: new Date().toISOString(),
    // 개발 환경에서만 스택 트레이스 포함
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    // 검증 에러 상세 정보 (있는 경우)
    ...(error.details && { details: error.details }),
  };

  // Send the standardized error response
  res.status(error.statusCode).json({
    error: sanitizedError,
    // 개발 환경에서만 요청 정보 포함
    ...(process.env.NODE_ENV === 'development' && { 
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    }),
  });
};

module.exports = errorHandler;