import React from 'react';

/**
 * 로딩 상태를 표시하는 스피너 컴포넌트
 * @param {object} props
 * @param {string} props.text - 스피너 아래에 표시될 텍스트 (옵션)
 * @param {string} props.className - 추가적인 스타일링을 위한 클래스
 */
const LoadingSpinner = ({ text = '불러오는 중...', className = '' }) => {
  return (
    <div className={`flex flex-col justify-center items-center p-10 ${className}`}>
      <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {text && <p className="text-gray-600 mt-4 text-lg">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;