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
 * 소셜 로그인 (네이버)
 * @param {string} code - 네이버 인증 코드
 * @returns {Promise<object>} The user object from the API response.
 */
const naverLogin = async (code) => {
  try {
    const response = await apiClient.post('/auth/naver', { code });
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens and user info in local storage
    setToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);

    return user;
  } catch (error) {
    throw error.response?.data?.error || new Error('네이버 로그인에 실패했습니다.');
  }
};

/**
 * 소셜 로그인 (카카오)
 * @param {string} code - 카카오 인증 코드
 * @returns {Promise<object>} The user object from the API response.
 */
const kakaoLogin = async (code) => {
  try {
    const response = await apiClient.post('/auth/kakao', { code });
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens and user info in local storage
    setToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);

    return user;
  } catch (error) {
    throw error.response?.data?.error || new Error('카카오 로그인에 실패했습니다.');
  }
};

/**
 * 아이디 찾기
 * @param {string} email - 사용자 이메일
 * @returns {Promise<object>} 응답 데이터
 */
const findId = async (email) => {
  try {
    const response = await apiClient.post('/auth/find-id', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('아이디 찾기에 실패했습니다.');
  }
};

/**
 * 비밀번호 찾기 (재설정 링크 발송)
 * @param {string} email - 사용자 이메일
 * @returns {Promise<object>} 응답 데이터
 */
const findPassword = async (email) => {
  try {
    const response = await apiClient.post('/auth/find-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('비밀번호 찾기에 실패했습니다.');
  }
};

/**
 * 비밀번호 재설정
 * @param {string} token - 재설정 토큰
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<object>} 응답 데이터
 */
const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiClient.post('/auth/reset-password', { 
      token, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('비밀번호 재설정에 실패했습니다.');
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
 * 사용자 프로필 이미지를 업로드합니다.
 * @param {File} imageFile - 업로드할 이미지 파일
 * @returns {Promise<object>} 업데이트된 사용자 정보
 */
const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    const response = await apiClient.put('/users/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 성공 시, Redux 스토어와 localStorage를 업데이트
    setUser(response.data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('프로필 이미지 업로드에 실패했습니다.');
  }
};

/**
 * 사용자 프로필 이미지를 삭제합니다.
 * @returns {Promise<object>} 업데이트된 사용자 정보
 */
const deleteProfileImage = async () => {
  try {
    const response = await apiClient.delete('/users/me/profile-image');
    
    // 성공 시, Redux 스토어와 localStorage를 업데이트
    setUser(response.data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('프로필 이미지 삭제에 실패했습니다.');
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
  naverLogin,
  kakaoLogin,
  findId,
  findPassword,
  resetPassword,
  logout,
  updateProfile,    // export 객체에 추가
  updatePassword,   // export 객체에 추가
  deleteAccount, // export 객체에 추가
  uploadProfileImage, // 프로필 이미지 업로드 추가
  deleteProfileImage, // 프로필 이미지 삭제 추가
};
