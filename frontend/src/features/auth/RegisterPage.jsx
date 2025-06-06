/**
 * @file RegisterPage.jsx
 * @description The user registration page component.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const { fullName, nickname, email, password } = formData;
      await authService.register({ fullName, nickname, email, password });
      alert('회원가입이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12">
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">AI CPX Tutor</h1>
          <p className="text-gray-500 mt-2">새 계정을 생성하세요</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">이름</label>
            <input id="fullName" name="fullName" type="text" onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nickname">닉네임</label>
            <input id="nickname" name="nickname" type="text" onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">이메일</label>
            <input id="email" name="email" type="email" onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">비밀번호</label>
            <input id="password" name="password" type="password" onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">비밀번호 확인</label>
            <input id="confirmPassword" name="confirmPassword" type="password" onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>
          
          <div className="flex items-center justify-between">
            <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-blue-300">
              {isLoading ? '가입 진행 중...' : '회원가입'}
            </button>
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="font-bold text-blue-500 hover:text-blue-800">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
