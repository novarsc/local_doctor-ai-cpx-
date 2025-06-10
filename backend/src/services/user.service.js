/**
 * @file user.service.js
 * @description Business logic for user-related operations.
 */

const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Fetches a user's profile by their ID.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<object>} The user object without the password.
 */
const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    // 보안을 위해 password 필드는 제외하고 조회합니다.
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }
  return user.toJSON();
};

module.exports = {
  getUserProfile,
};
