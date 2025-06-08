/**
 * @file PostPracticePage.jsx
 * @description Page to display feedback and results after a practice session is completed.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedback, clearPracticeSession } from '../../../store/slices/practiceSessionSlice';

// 아코디언 UI를 위한 재사용 컴포넌트
const FeedbackAccordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-4 font-semibold text-left text-gray-800 hover:bg-gray-50"
            >
                <span>{title}</span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
            </button>
            {isOpen && <div className="p-4 border-t border-gray-200 text-gray-700">{children}</div>}
        </div>
    );
};

const PostPracticePage = () => {
    const { scenarioId } = useParams();
    const dispatch = useDispatch();
    const { sessionId, currentScenario, feedback, evaluationStatus, chatLog } = useSelector(state => state.practiceSession);

    // AI 채점 결과를 주기적으로 폴링합니다.
    useEffect(() => {
        if (sessionId && evaluationStatus !== 'completed') {
            const getFeedback = () => {
                // evaluationStatus가 'evaluating' 또는 'loading'일 때만 요청
                const currentStatus = store.getState().practiceSession.evaluationStatus;
                if (currentStatus === 'evaluating' || currentStatus === 'loading') {
                    dispatch(fetchFeedback(sessionId));
                }
            };
            
            getFeedback(); // 즉시 1회 실행
            const interval = setInterval(getFeedback, 5000); // 5초마다 반복

            return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
        }
    }, [dispatch, sessionId, evaluationStatus]);
    
    // 이 페이지를 벗어날 때, practiceSession 상태를 초기화합니다.
    useEffect(() => {
        return () => {
            dispatch(clearPracticeSession());
        }
    }, [dispatch]);
    

    // 채점 중일 때 로딩 화면 표시
    if (evaluationStatus !== 'completed' || !feedback) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="text-center">
                     <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <h1 className="text-2xl font-bold text-gray-800">채점 진행 중</h1>
                    <p className="text-gray-600 mt-2">AI가 실습 내용을 분석하고 있습니다. 잠시만 기다려주세요.</p>
                </div>
            </div>
        );
    }
    
    return (
    // 1. 전체 레이아웃을 flex 컨테이너로 구성합니다.
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* 2. 중앙 메인 패널 (채팅창) */}
      <div className="flex flex-col flex-grow h-full">
        {/* 헤더: 그림자와 패딩을 추가해 입체감을 줍니다. */}
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
          <h1 className="text-xl font-bold text-gray-800">{currentScenario?.name || 'CPX 실습'}</h1>
          <TimerDisplay />
        </header>
        
        {/* 메인 채팅 영역: 배경색과 패딩을 조정합니다. */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {chatLog.map((msg, index) => (
            // 3. 채팅 버블 디자인 개선
            <div key={msg.id || index} className={`flex items-end gap-3 max-w-xl ${msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}>
              {msg.sender === 'ai' && (
                // AI 아바타를 추가합니다.
                <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">AI</div>
              )}
              <div className={`px-5 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-white text-gray-800 shadow-sm rounded-bl-lg'}`}>
                {/* 줄바꿈이 자연스럽게 적용되도록 whitespace-pre-wrap 추가 */}
                <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* AI 응답 대기 중일 때 로딩 인디케이터를 표시합니다. */}
          {isAiResponding && chatLog[chatLog.length - 1]?.sender === 'user' && (
             <div className="flex items-end gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">AI</div>
                <div className="px-5 py-3 rounded-2xl bg-white text-gray-800 shadow-sm rounded-bl-lg">
                    {/* 타이핑하는 듯한 효과를 주는 세 개의 점 애니메이션 */}
                    <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                    </div>
                </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        {/* 푸터 (입력창): 상단 경계선을 추가하여 구분합니다. */}
        <footer className="p-4 bg-white border-t border-gray-200">
          {error && <p className="text-red-500 text-sm mb-2 text-center">오류: {error}</p>}
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input 
                type="text" 
                value={userInput} 
                onChange={(e) => setUserInput(e.target.value)} 
                placeholder={isAiResponding ? "AI가 응답 중입니다..." : "여기에 메시지를 입력하세요..."} 
                className="input-base flex-1 !p-3" // !p-3로 패딩 강제 적용
                disabled={isAiResponding} 
            />
            <button 
                type="submit" 
                disabled={isAiResponding || !userInput.trim()} 
                className="btn btn-primary !py-3 !px-6" // !py-3, !px-6로 패딩 강제 적용
            >
                전송
            </button>
          </form>
        </footer>
      </div>

      {/* 4. 우측 사이드바 (메모장) 디자인 개선 */}
      <aside className="w-96 bg-white border-l border-gray-200 flex flex-col h-full flex-shrink-0">
         <div className="p-4 border-b border-gray-200"><h2 className="font-bold text-lg text-gray-800">메모장</h2></div>
        <textarea 
            placeholder="실습 중 필요한 내용을 자유롭게 메모하세요..." 
            className="w-full h-full p-4 text-base leading-relaxed focus:outline-none resize-none border-0 bg-white"
        ></textarea>
        <div className="p-4 mt-auto border-t border-gray-200">
            <button onClick={handleEndSession} className="btn btn-danger w-full !py-3 text-base">
                진료 종료
            </button>
        </div>
      </aside>
    </div>
  );
};

export default PostPracticePage;