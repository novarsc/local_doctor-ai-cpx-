import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';
import { extractAuthData } from '../../utils/socialLogin';
import { setToken, setRefreshToken, setUser } from '../../utils/localStorageHelper';

const SocialCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleSocialCallback = async () => {
      try {
        // URL에서 토큰과 사용자 정보 추출
        const { accessToken, refreshToken, user, error: authError } = extractAuthData(location.search);

        if (authError) {
          const errorMessages = {
            'social_login_failed': '소셜 로그인에 실패했습니다.',
            'token_generation_failed': '토큰 생성에 실패했습니다.',
          };
          setError(errorMessages[authError] || '로그인 중 오류가 발생했습니다.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!accessToken || !refreshToken || !user) {
          setError('인증 정보가 불완전합니다.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // 토큰과 사용자 정보를 localStorage에 저장
        setToken(accessToken);
        setRefreshToken(refreshToken);
        setUser(user);

        // Redux 상태 업데이트
        dispatch(loginSuccess({
          accessToken,
          refreshToken,
          user
        }));

        // 성공 시 대시보드로 이동
        navigate('/dashboard');
      } catch (err) {
        console.error('Social login callback error:', err);
        setError(err.message || '소셜 로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleSocialCallback();
  }, [location.search, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-lg rounded-lg text-center">
        {error ? (
          <>
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">로그인 실패</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="text-blue-500 text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">로그인 처리 중</h1>
            <p className="text-gray-600 mb-6">잠시만 기다려주세요...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default SocialCallbackPage; 