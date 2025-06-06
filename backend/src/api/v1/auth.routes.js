/**
 * @file auth.routes.js
 * @description Defines API routes for authentication.
 * Maps endpoints to controller functions.
 */

const express = require('express');
const authController = require('../../controllers/auth.controller');
// const validator = require('../../middlewares/validator.middleware'); // Assuming a validator middleware exists
// const { registerSchema, loginSchema } = require('../../dto/auth.schemas'); // Assuming validation schemas exist

const router = express.Router();

// Route for user registration
// POST /api/v1/auth/register
// Example with validator: router.post('/register', validator(registerSchema), authController.register);
router.post('/register', authController.register);

// Route for user login
// POST /api/v1/auth/login
// Example with validator: router.post('/login', validator(loginSchema), authController.login);
router.post('/login', authController.login);

// Other auth routes like /logout, /refresh-token will be added here
// POST /api/v1/auth/logout
// router.post('/logout', ...);

// POST /api/v1/auth/refresh-token
// router.post('/refresh-token', ...);


module.exports = router;
