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

module.exports = {
  register,
  login,
};
