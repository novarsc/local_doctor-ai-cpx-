/**
 * @file LoginPage.jsx
 * @description The user login page component.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import Button from '../../components/common/Button'; // Button 컴포넌트 사용

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, isAuthenticated, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 로그인 상태가 변경되면(성공하면) 자동으로 페이지를 이동시키는 핵심 로직
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">AI CPX Tutor</h1>
          <p className="text-gray-500 mt-2">로그인하여 학습을 시작하세요</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base" // 공통 스타일 적용
              required
              placeholder="user@example.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base" // 공통 스타일 적용
              required
              placeholder="********"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full" // 공통 Button 컴포넌트 사용
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link to="/register" className="font-bold text-primary hover:text-primary-dark">
                회원가입
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;