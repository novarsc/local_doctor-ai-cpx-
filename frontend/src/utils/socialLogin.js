/**
 * @file socialLogin.js
 * @description 소셜 로그인 관련 유틸리티 함수들 (Passport 기반)
 */

// 백엔드 API 서버 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * 네이버 로그인 URL 생성 (Passport 기반)
 * @returns {string} 네이버 로그인 URL
 */
export const getNaverLoginUrl = () => {
  return `${API_BASE_URL}/api/v1/auth/naver/login`;
};

/**
 * 구글 로그인 URL 생성 (Passport 기반)
 * @returns {string} 구글 로그인 URL
 */
export const getGoogleLoginUrl = () => {
  return `${API_BASE_URL}/api/v1/auth/google/login`;
};

/**
 * 카카오 로그인 URL 생성 (Passport 기반)
 * @returns {string} 카카오 로그인 URL
 */
export const getKakaoLoginUrl = () => {
  return `${API_BASE_URL}/api/v1/auth/kakao/login`;
};

/**
 * URL에서 토큰 및 사용자 정보 추출 (Passport 콜백용)
 * @param {string} url - 현재 URL
 * @returns {object} { accessToken, refreshToken, user, error }
 */
export const extractAuthData = (url) => {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const accessToken = urlParams.get('accessToken');
  const refreshToken = urlParams.get('refreshToken');
  const userString = urlParams.get('user');
  const error = urlParams.get('error');
  
  let user = null;
  if (userString) {
    try {
      user = JSON.parse(decodeURIComponent(userString));
    } catch (e) {
      console.error('사용자 정보 파싱 오류:', e);
    }
  }
  
  return { accessToken, refreshToken, user, error };
};

/**
 * 소셜 로그인 처리 (Passport 기반)
 * @param {string} provider - 소셜 로그인 제공자 (naver, google, kakao)
 */
export const handleSocialLogin = (provider) => {
  let loginUrl;
  
  switch (provider) {
    case 'naver':
      loginUrl = getNaverLoginUrl();
      break;
    case 'google':
      loginUrl = getGoogleLoginUrl();
      break;
    case 'kakao':
      loginUrl = getKakaoLoginUrl();
      break;
    default:
      throw new Error('지원하지 않는 소셜 로그인 제공자입니다.');
  }
  
  // 현재 창에서 소셜 로그인 페이지로 이동
  window.location.href = loginUrl;
}; 