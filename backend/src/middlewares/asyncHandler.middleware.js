/**
 * @file asyncHandler.middleware.js
 * @description A wrapper for async route handlers to catch errors and pass them to the global error handler.
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = asyncHandler;