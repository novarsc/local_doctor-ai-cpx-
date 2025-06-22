import React, { useState } from 'react';
import Button from './Button';

const ForgotPasswordModal = ({ isOpen, onClose, onFindId, onFindPassword }) => {
  const [activeTab, setActiveTab] = useState('password'); // 'id' or 'password'
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      if (activeTab === 'id') {
        await onFindId(email);
        setMessage('입력하신 이메일로 아이디 정보를 발송했습니다.');
      } else {
        await onFindPassword(email);
        setMessage('입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.');
      }
    } catch (error) {
      setMessage(error.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">계정 찾기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 버튼 */}
        <div className="flex mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('id')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'id'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            아이디 찾기
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'password'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            비밀번호 찾기
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {activeTab === 'id' ? '가입 시 사용한 이메일' : '가입한 이메일'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="user@example.com"
              required
            />
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${
              message.includes('발송') 
                ? 'bg-green-100 text-green-700 border border-green-400'
                : 'bg-red-100 text-red-700 border border-red-400'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? '처리 중...' : (activeTab === 'id' ? '아이디 찾기' : '비밀번호 찾기')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal; 