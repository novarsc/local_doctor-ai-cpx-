/**
 * @file ApiError.js
 * @description Custom error class for handling API errors with status codes.
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code.
   * @param {string} errorCode - A custom, unique error code string for the specific error.
   * @param {string} message - A human-readable error message.
   * @param {boolean} isOperational - True if the error is a predictable, operational error.
   * @param {string} stack - Optional error stack.
   */
  constructor(statusCode, errorCode, message = 'An error occurred', isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;