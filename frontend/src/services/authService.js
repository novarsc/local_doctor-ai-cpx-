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

/**
 * 사용자 프로필 정보(닉네임 등)를 업데이트합니다.
 * @param {object} profileData - { nickname }
 * @returns {Promise<object>} 업데이트된 사용자 정보
 */
const updateProfile = async (profileData) => {
  try {
    // API 명세서 2.2.2. PUT /api/v1/users/me/profile
    const response = await apiClient.put('/users/me/profile', profileData);
    // 성공 시, Redux 스토어와 localStorage를 업데이트해야 합니다.
    setUser(response.data); // localStorageHelper를 사용해 유저 정보 업데이트
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('프로필 업데이트에 실패했습니다.');
  }
};

/**
 * 사용자 비밀번호를 변경합니다.
 * @param {object} passwordData - { currentPassword, newPassword }
 * @returns {Promise<void>}
 */
const updatePassword = async (passwordData) => {
  try {
    // API 명세서 2.2.3. PUT /api/v1/users/me/password
    await apiClient.put('/users/me/password', passwordData);
  } catch (error) {
    throw error.response?.data?.error || new Error('비밀번호 변경에 실패했습니다.');
  }
};

/**
 * 현재 로그인된 사용자 계정을 삭제합니다.
 * @param {string} password - 본인 확인을 위한 현재 비밀번호
 * @returns {Promise<void>}
 */
const deleteAccount = async (password) => {
  try {
    // TODO: 백엔드에 DELETE /api/v1/users/me 엔드포인트 구현 필요
    // 본인 확인을 위해 body에 비밀번호를 담아 전송합니다.
    await apiClient.delete('/users/me', {
      data: { password: password }
    });
    // 계정 삭제 성공 시, 로컬에 저장된 토큰도 모두 삭제합니다.
    logout();
  } catch (error) {
    throw error.response?.data?.error || new Error('계정 삭제에 실패했습니다. 비밀번호를 확인해주세요.');
  }
};


export const authService = {
  register,
  login,
  logout,
  updateProfile,    // export 객체에 추가
  updatePassword,   // export 객체에 추가
  deleteAccount, // export 객체에 추가
};
