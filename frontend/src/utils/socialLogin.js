/**
 * @file socialLogin.js
 * @description 소셜 로그인 관련 유틸리티 함수들
 */

// 네이버 로그인 설정
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID || 'your_naver_client_id';
const NAVER_REDIRECT_URI = import.meta.env.VITE_NAVER_REDIRECT_URI || 'http://localhost:3000/auth/callback?provider=naver';

// 카카오 로그인 설정
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID || 'your_kakao_client_id';
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/callback?provider=kakao';

/**
 * 네이버 로그인 URL 생성
 * @returns {string} 네이버 로그인 URL
 */
export const getNaverLoginUrl = () => {
  const state = Math.random().toString(36).substr(2, 11);
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(NAVER_REDIRECT_URI)}&state=${state}`;
  
  // state를 localStorage에 저장하여 CSRF 공격 방지
  localStorage.setItem('naver_state', state);
  
  return naverAuthUrl;
};

/**
 * 카카오 로그인 URL 생성
 * @returns {string} 카카오 로그인 URL
 */
export const getKakaoLoginUrl = () => {
  const state = Math.random().toString(36).substr(2, 11);
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&state=${state}`;
  
  // state를 localStorage에 저장하여 CSRF 공격 방지
  localStorage.setItem('kakao_state', state);
  
  return kakaoAuthUrl;
};

/**
 * URL에서 인증 코드 추출
 * @param {string} url - 현재 URL
 * @returns {object} { code, state, error }
 */
export const extractAuthCode = (url) => {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  return { code, state, error };
};

/**
 * 네이버 로그인 처리
 * @param {string} code - 인증 코드
 * @param {string} state - 상태값
 * @returns {Promise<object>} 사용자 정보
 */
export const handleNaverLogin = async (code, state) => {
  // state 검증
  const savedState = localStorage.getItem('naver_state');
  if (state !== savedState) {
    throw new Error('인증 상태가 일치하지 않습니다.');
  }
  
  // localStorage에서 state 제거
  localStorage.removeItem('naver_state');
  
  // 백엔드로 코드 전송
  const response = await fetch('/api/v1/auth/naver', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    throw new Error('네이버 로그인에 실패했습니다.');
  }
  
  return response.json();
};

/**
 * 카카오 로그인 처리
 * @param {string} code - 인증 코드
 * @param {string} state - 상태값
 * @returns {Promise<object>} 사용자 정보
 */
export const handleKakaoLogin = async (code, state) => {
  // state 검증
  const savedState = localStorage.getItem('kakao_state');
  if (state !== savedState) {
    throw new Error('인증 상태가 일치하지 않습니다.');
  }
  
  // localStorage에서 state 제거
  localStorage.removeItem('kakao_state');
  
  // 백엔드로 코드 전송
  const response = await fetch('/api/v1/auth/kakao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    throw new Error('카카오 로그인에 실패했습니다.');
  }
  
  return response.json();
};

/**
 * 소셜 로그인 팝업 열기
 * @param {string} url - 소셜 로그인 URL
 * @returns {Promise<object>} 사용자 정보
 */
export const openSocialLoginPopup = (url) => {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      url,
      'socialLogin',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('로그인이 취소되었습니다.'));
      }
    }, 1000);
    
    // 팝업에서 메시지 수신
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'SOCIAL_LOGIN_SUCCESS') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', handleMessage);
        resolve(event.data.user);
      } else if (event.data.type === 'SOCIAL_LOGIN_ERROR') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', handleMessage);
        reject(new Error(event.data.error));
      }
    };
    
    window.addEventListener('message', handleMessage);
  });
}; 