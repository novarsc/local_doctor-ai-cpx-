/**
 * @file localStorageHelper.js
 * @description Utility functions for interacting with localStorage.
 * Manages storing and retrieving authentication tokens and user data.
 */

const ACCESS_TOKEN_KEY = 'aichpx_access_token';
const REFRESH_TOKEN_KEY = 'aichpx_refresh_token';
const USER_INFO_KEY = 'aichpx_user_info';

/**
 * Retrieves the access token from localStorage.
 * @returns {string|null} The access token or null if not found.
 */
export const getToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Stores the access token in localStorage.
 * @param {string} token The access token to store.
 */
export const setToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Retrieves the refresh token from localStorage.
 * @returns {string|null} The refresh token or null if not found.
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Stores the refresh token in localStorage.
 * @param {string} token The refresh token to store.
 */
export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

/**
 * Retrieves user information from localStorage.
 * @returns {object|null} The parsed user object or null if not found.
 */
export const getUser = () => {
  const user = localStorage.getItem(USER_INFO_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Stores user information in localStorage.
 * @param {object} user The user object to store.
 */
export const setUser = (user) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
};

/**
 * Clears all authentication-related data from localStorage.
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};
