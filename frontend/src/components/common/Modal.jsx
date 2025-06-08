import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button'; // 우리가 만든 Button 컴포넌트 사용

/**
 * 재사용 가능한 모달 컴포넌트
 * @param {object} props
 * @param {boolean} props.isOpen - 모달의 열림/닫힘 상태
 * @param {function} props.onClose - 모달을 닫는 함수
 * @param {string} props.title - 모달의 제목
 * @param {React.ReactNode} props.children - 모달 내부에 표시될 내용
 * @param {React.ReactNode} props.footer - 확인/취소 버튼 등이 들어갈 푸터 영역
 */
const Modal = ({ isOpen, onClose, title, children, footer }) => {
  // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  // 'Escape' 키를 눌렀을 때 모달이 닫히도록 하는 효과
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // React Portal을 사용하여 #modal-root에 렌더링
  return ReactDOM.createPortal(
    // 모달 배경 (어두운 오버레이)
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose} // 배경 클릭 시 닫기
    >
      {/* 실제 모달 컨텐츠 */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()} // 컨텐츠 클릭 시에는 닫히지 않도록 이벤트 전파 중단
      >
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-5">
          {children}
        </div>

        {/* 모달 푸터 (버튼 등) */}
        {footer && (
          <div className="flex justify-end p-5 border-t space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default Modal;