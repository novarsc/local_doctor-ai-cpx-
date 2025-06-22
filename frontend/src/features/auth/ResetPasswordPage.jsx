import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetUserPassword } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState(null);
  const [isValidToken, setIsValidToken] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setFormError('유효하지 않은 링크입니다.');
      return;
    }
    setIsValidToken(true);
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setFormError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setFormError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      await dispatch(resetUserPassword({ 
        token, 
        newPassword: formData.newPassword 
      })).unwrap();
      
      alert('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
    } catch (err) {
      setFormError(err.message || '비밀번호 재설정에 실패했습니다.');
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="max-w-md w-full mx-auto p-8 bg-white shadow-lg rounded-lg text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">유효하지 않은 링크</h1>
          <p className="text-gray-600 mb-6">{formError}</p>
          <Button onClick={() => navigate('/login')} variant="primary">
            로그인 페이지로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">비밀번호 재설정</h1>
          <p className="text-gray-500 mt-2">새로운 비밀번호를 입력해주세요</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {formError}
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
              새 비밀번호
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className="input-base"
              required
              placeholder="새 비밀번호 (8자 이상)"
              minLength={8}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              새 비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-base"
              required
              placeholder="새 비밀번호 확인"
              minLength={8}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full"
            >
              {isLoading ? '처리 중...' : '비밀번호 변경'}
            </Button>
          </div>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-primary hover:text-primary-dark underline"
            >
              로그인 페이지로 돌아가기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 