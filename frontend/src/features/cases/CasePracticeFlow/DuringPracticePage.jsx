/**
 * @file DuringPracticePage.jsx
 * @description The main page for the interactive CPX practice session with the AI patient.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { practiceSessionService } from '../../../services/practiceSessionService';
import { 
  addUserMessage, 
  appendAiMessageChunk, 
  endAiResponse,
  setPracticeError,
  completeSession,
  resumePracticeSession, // 새로 추가: 이어하기 액션
} from '../../../store/slices/practiceSessionSlice';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// 타이머 컴포넌트
const TimerDisplay = ({ initialMinutes = 12 }) => {
    const [seconds, setSeconds] = useState(initialMinutes * 60);
    useEffect(() => {
        const interval = setInterval(() => { setSeconds(s => s > 0 ? s - 1 : 0); }, 1000);
        return () => clearInterval(interval);
    }, []);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return <div className="font-mono text-lg bg-red-100 text-red-700 px-3 py-1 rounded-md">{String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}</div>;
};

const DuringPracticePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { sessionId } = useParams(); // URL에서 sessionId를 가져옵니다.
    
    // Redux 스토어에서 현재 세션 ID도 가져와서 비교용으로 사용합니다.
    const currentSessionId = useSelector(state => state.practiceSession.sessionId);
    const currentScenario = useSelector(state => state.practiceSession.currentScenario);
    const chatLog = useSelector(state => state.practiceSession.chatLog);
    const isAiResponding = useSelector(state => state.practiceSession.isAiResponding);
    const isLoading = useSelector(state => state.practiceSession.isLoading);
    const error = useSelector(state => state.practiceSession.error);
    
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    // --- 이 useEffect 로직이 핵심적인 수정사항입니다 ---
    useEffect(() => {
        // URL에 sessionId가 있고, 현재 Redux 스토어의 세션 ID와 다르거나 채팅 기록이 비어있다면
        // '이어하기'로 간주하고 대화 기록을 불러옵니다.
        if (sessionId && (sessionId !== currentSessionId || chatLog.length === 0)) {
            dispatch(resumePracticeSession(sessionId));
        } else if (!sessionId && !currentSessionId) {
            // URL에도, 스토어에도 세션 ID가 없는 비정상적인 접근일 경우
            alert('실습 세션 정보가 없습니다. 증례 목록으로 돌아갑니다.');
            navigate('/cases');
        }
    }, [sessionId, currentSessionId, dispatch, navigate, chatLog.length]);


    // 새 메시지가 추가될 때마다 채팅창을 맨 아래로 스크롤합니다.
    useEffect(() => { 
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [chatLog]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!userInput.trim() || isAiResponding) return;
        
        const currentSessionToUse = sessionId || currentSessionId;
        
        dispatch(addUserMessage(userInput));
        
        practiceSessionService.sendChatMessageAndStream({
            sessionId: currentSessionToUse,
            messageContent: userInput,
            onData: (data) => {
                if (data.chunk) {
                    dispatch(appendAiMessageChunk({ chunk: data.chunk }));
                } else if (data.error) {
                    dispatch(setPracticeError(data.error.message));
                }
            },
            onEnd: () => {
                dispatch(endAiResponse());
            },
            onError: (err) => {
                dispatch(setPracticeError(err.toString()));
            },
        });
        
        setUserInput('');
    };
    
    const handleEndSession = () => {
        if (window.confirm('정말로 진료를 종료하시겠습니까? 채점이 시작됩니다.')) {
            dispatch(completeSession(sessionId))
                .unwrap()
                .then(() => {
                    navigate(`/cases/results/${sessionId}`);
                })
                .catch(err => {
                    alert(`세션 종료에 실패했습니다: ${err.message}`);
                });
        }
    };

    if (isLoading && chatLog.length === 0) {
        return <div className="flex justify-center items-center h-screen"><LoadingSpinner text="실습 기록을 불러오는 중..."/></div>;
    }

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            {/* 중앙 메인 패널 (채팅창) */}
            <div className="flex flex-col flex-grow h-full">
                <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                    <h1 className="text-xl font-bold text-gray-800">{currentScenario?.name || 'CPX 실습'}</h1>
                    <TimerDisplay />
                </header>
                
                <main className="flex-1 overflow-y-auto p-6 space-y-5">
                    {chatLog.map((msg, index) => (
                        <div key={msg.id || index} className={`flex items-end gap-3 max-w-xl ${msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}>
                            {msg.sender === 'ai' && (
                                <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">AI</div>
                            )}
                            <div className={`px-5 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-white text-gray-800 shadow-sm rounded-bl-lg'}`}>
                                <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {isAiResponding && chatLog[chatLog.length - 1]?.sender === 'user' && (
                         <div className="flex items-end gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">AI</div>
                            <div className="px-5 py-3 rounded-2xl bg-white text-gray-800 shadow-sm rounded-bl-lg">
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

                <footer className="p-4 bg-white border-t border-gray-200">
                    {error && <p className="text-red-500 text-sm mb-2 text-center">오류: {error}</p>}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input 
                            type="text" 
                            value={userInput} 
                            onChange={(e) => setUserInput(e.target.value)} 
                            placeholder={isAiResponding ? "AI가 응답 중입니다..." : "여기에 메시지를 입력하세요..."} 
                            className="input-base flex-1 !p-3"
                            disabled={isAiResponding} 
                        />
                        <Button
                            type="submit" 
                            disabled={isAiResponding || !userInput.trim()} 
                            variant="primary"
                            className="!py-3 !px-6"
                        >
                            전송
                        </Button>
                    </form>
                </footer>
            </div>

            {/* 우측 사이드바 (메모장) */}
            <aside className="w-96 bg-white border-l border-gray-200 flex flex-col h-full flex-shrink-0">
                 <div className="p-4 border-b border-gray-200"><h2 className="font-bold text-lg text-gray-800">메모장</h2></div>
                <textarea 
                    placeholder="실습 중 필요한 내용을 자유롭게 메모하세요..." 
                    className="w-full h-full p-4 text-base leading-relaxed focus:outline-none resize-none border-0 bg-white"
                ></textarea>
                <div className="p-4 mt-auto border-t border-gray-200">
                    <Button onClick={handleEndSession} variant="danger" className="w-full !py-3 text-base">
                        진료 종료
                    </Button>
                </div>
            </aside>
        </div>
    );
};

export default DuringPracticePage;