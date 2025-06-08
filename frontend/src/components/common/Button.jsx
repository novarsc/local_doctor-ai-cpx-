import React from 'react';

/**
 * 재사용 가능한 공통 버튼 컴포넌트
 * @param {object} props
 * @param {'primary' | 'secondary' | 'danger'} props.variant - 버튼 스타일 (기본값: 'primary')
 * @param {React.ReactNode} props.children - 버튼 내부에 표시될 내용
 * @param {string} props.className - 추가적인 TailwindCSS 클래스
 */
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = 'font-bold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary-light disabled:bg-primary-light disabled:cursor-not-allowed',
    secondary: 'bg-white text-primary border border-primary hover:bg-blue-50 focus:ring-primary-light',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
  };

  const combinedClassName = `${baseStyle} ${variantStyles[variant]} ${className}`;

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

export default Button;