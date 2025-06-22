import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { naverLogin, kakaoLogin } from '../../store/slices/authSlice';
import { extractAuthCode } from '../../utils/socialLogin';

const SocialCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleSocialCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const provider = searchParams.get('provider') || 'naver'; // 기본값은 naver

        if (error) {
          setError('로그인이 취소되었습니다.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!code) {
          setError('인증 코드를 받지 못했습니다.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // 소셜 로그인 처리
        if (provider === 'naver') {
          await dispatch(naverLogin(code)).unwrap();
        } else if (provider === 'kakao') {
          await dispatch(kakaoLogin(code)).unwrap();
        }

        // 성공 시 대시보드로 이동
        navigate('/dashboard');
      } catch (err) {
        console.error('Social login error:', err);
        setError(err.message || '소셜 로그인에 실패했습니다.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleSocialCallback();
  }, [searchParams, dispatch, navigate]);

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