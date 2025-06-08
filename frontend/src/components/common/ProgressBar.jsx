import React from 'react';

/**
 * 진행률을 시각적으로 표시하는 프로그레스 바 컴포넌트
 * @param {object} props
 * @param {number} props.value - 진행률 값 (0-100)
 * @param {string} props.className - 추가적인 스타일을 위한 클래스
 */
const ProgressBar = ({ value, className = '' }) => {
  // value가 0-100 사이의 값이 되도록 보정
  const progress = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div 
        className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${progress}%` }}
      >
      </div>
    </div>
  );
};

export default ProgressBar;