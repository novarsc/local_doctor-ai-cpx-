/**
 * @file RegisterPage.jsx
 * @description The user registration page component.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error: reduxError } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (formData.password !== formData.confirmPassword) {
      setFormError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const { fullName, nickname, email, password } = formData;
    dispatch(registerUser({ fullName, nickname, email, password }))
      .unwrap()
      .then(() => {
        alert('회원가입이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
        navigate('/login');
      })
      .catch((err) => {
        // 에러는 reduxError 상태로 자동 처리되므로, 콘솔에만 기록합니다.
        console.error('Registration failed:', err);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12">
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">AI CPX Tutor</h1>
          <p className="text-gray-500 mt-2">새 계정을 생성하세요</p>
        </div>
        <form onSubmit={handleSubmit}>
          {/* 폼 자체 유효성 검사 에러 (예: 비밀번호 불일치) */}
          {formError && <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">{formError}</div>}
          {/* API 요청 후 Redux를 통해 전달된 에러 (예: 이메일 중복) */}
          {reduxError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{reduxError}</div>}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">이름</label>
            <input id="fullName" name="fullName" type="text" onChange={handleChange} value={formData.fullName} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nickname">닉네임</label>
            <input id="nickname" name="nickname" type="text" onChange={handleChange} value={formData.nickname} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">이메일</label>
            <input id="email" name="email" type="email" onChange={handleChange} value={formData.email} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">비밀번호</label>
            <input id="password" name="password" type="password" onChange={handleChange} value={formData.password} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">비밀번호 확인</label>
            <input id="confirmPassword" name="confirmPassword" type="password" onChange={handleChange} value={formData.confirmPassword} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
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