import React, { useEffect, useRef } from 'react';
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
 * @param {function} props.onEnter - 모달이 열려 있을 때 Enter 키를 누르면 동작할 함수
 */
const Modal = ({ isOpen, onClose, title, children, footer, onEnter }) => {
  const isOpenRef = useRef(isOpen);
  const onEnterRef = useRef(onEnter);

  // ref를 최신 값으로 업데이트
  useEffect(() => {
    isOpenRef.current = isOpen;
    onEnterRef.current = onEnter;
  }, [isOpen, onEnter]);

  // 'Escape' 또는 'Enter' 키를 눌렀을 때 모달이 닫히거나 onEnter가 동작하도록
  useEffect(() => {
    const handleKey = (event) => {
      // 모달이 닫혔거나 onEnter가 없으면 이벤트를 처리하지 않음
      if (!isOpenRef.current || !onEnterRef.current) return;

      if (event.key === 'Escape') {
        onEnterRef.current = null; // onEnter 함수 무효화
        onClose();
      } else if (event.key === 'Enter') {
        event.preventDefault(); // 폼 submit 등 방지
        event.stopPropagation(); // 이벤트 전파 중단
        
        // onEnter 함수를 호출하기 전에 한 번 더 확인
        if (onEnterRef.current && isOpenRef.current) {
          const currentOnEnter = onEnterRef.current;
          onEnterRef.current = null; // 즉시 무효화
          currentOnEnter();
        }
      }
    };
    
    // 모달이 열려있을 때만 이벤트 리스너 추가
    if (isOpen) {
      window.addEventListener('keydown', handleKey, true); // capture phase에서 처리
    }
    
    return () => {
      // 컴포넌트 언마운트 또는 isOpen이 false가 될 때 이벤트 리스너 제거
      window.removeEventListener('keydown', handleKey, true);
      // cleanup 시에도 onEnter 함수 무효화
      onEnterRef.current = null;
    };
  }, [onClose, isOpen]); // onEnter를 의존성 배열에서 제거하여 ref로 관리

  // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

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