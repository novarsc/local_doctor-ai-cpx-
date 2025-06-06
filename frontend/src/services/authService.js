/**
 * @file authService.js
 * @description Service functions for authentication-related API calls.
 * Uses the configured apiClient to interact with the backend.
 */

import apiClient from './apiClient';
// We'll create this helper module in a later step.
import { setToken, setRefreshToken, setUser, clearTokens } from '../utils/localStorageHelper';

/**
 * Registers a new user.
 * @param {object} userData - { email, password, fullName, nickname }
 * @returns {Promise<object>} The response data from the API.
 */
const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    // Re-throw the error to be handled by the component/hook
    throw error.response?.data?.error || new Error('Registration failed');
  }
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} The user object from the API response.
 */
const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens and user info in local storage
    setToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);

    return user;
  } catch (error) {
    throw error.response?.data?.error || new Error('Login failed');
  }
};

/**
 * Logs out the current user.
 */
const logout = () => {
  // Clear all authentication data from local storage
  clearTokens();
  // Optionally, you can also make a call to the backend to invalidate the refresh token
  // apiClient.post('/auth/logout', { refreshToken: getRefreshToken() });
};


export const authService = {
  register,
  login,
  logout,
};
