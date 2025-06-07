/**
 * @file errorHandler.middleware.js
 * @description Global error handling middleware for the Express application.
 */

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

  // 🪵 [중요] 콘솔에 에러의 모든 정보를 출력합니다.
  console.error('🔴 An error occurred!');
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack); // <-- 이 부분이 가장 중요합니다!

  // In development, log the full error stack
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }

  // Send the standardized error response
  res.status(error.statusCode).json({
    error: {
      code: error.errorCode,
      message: error.message,
      // Optionally include details for validation errors etc.
      ...(error.details && { details: error.details }),
    },
  });
};

module.exports = errorHandler;