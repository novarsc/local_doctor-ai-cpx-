/**
 * @file auth.service.js
 * @description Authentication-related business logic (Service Layer)
 * Handles user registration, login, token management, etc.
 */

const { User } = require('../models'); // Assuming models/index.js exports all models
const passwordHasher = require('../utils/passwordHasher');
const tokenManager = require('../utils/tokenManager');
const ApiError = require('../utils/ApiError');
const { USER_ROLE } = require('../enums/UserRole.enum');

/**
 * Registers a new user.
 * @param {object} userData - The user data for registration.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.password - The user's password.
 * @param {string} userData.fullName - The user's full name.
 * @param {string} userData.nickname - The user's nickname.
 * @returns {Promise<object>} The newly created user object (without password).
 * @throws {ApiError} If the email or nickname already exists.
 */
const registerUser = async (userData) => {
  const { email, password, fullName, nickname } = userData;

  // 1. Check for duplicate email
  const existingUserByEmail = await User.findOne({ where: { email } });
  if (existingUserByEmail) {
    throw new ApiError(409, 'U001_EMAIL_DUPLICATED', 'An account with this email already exists.');
  }

  // 2. Check for duplicate nickname
  const existingUserByNickname = await User.findOne({ where: { nickname } });
  if (existingUserByNickname) {
    throw new ApiError(409, 'U002_NICKNAME_DUPLICATED', 'This nickname is already in use.');
  }

  // 3. Hash the password
  const hashedPassword = await passwordHasher.hashPassword(password);

  // 4. Create the user in the database
  const newUser = await User.create({
    email,
    password: hashedPassword,
    fullName,
    nickname,
    role: USER_ROLE.USER, // Assign default user role
    emailVerified: false, // Email is not verified on registration
  });

  // 5. Return the created user object, excluding the password
  const userObject = newUser.toJSON();
  delete userObject.password;

  return userObject;
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} An object containing access and refresh tokens, and user info.
 * @throws {ApiError} If credentials are invalid.
 */
const loginUser = async (email, password) => {
    // 1. Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new ApiError(401, 'A001_INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // 2. Compare the provided password with the stored hashed password
    const isPasswordValid = await passwordHasher.comparePasswords(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'A001_INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // 3. Generate JWT tokens
    const payload = {
        userId: user.userId,
        role: user.role,
    };
    const accessToken = tokenManager.generateAccessToken(payload);
    const refreshToken = tokenManager.generateRefreshToken(payload);

    // 4. Prepare user info to return
    const userObject = user.toJSON();
    delete userObject.password;

    return {
        accessToken,
        refreshToken,
        user: userObject,
    };
};


module.exports = {
  registerUser,
  loginUser,
};
