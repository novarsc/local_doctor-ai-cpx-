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
import Modal from '../../../components/common/Modal';
import BlockMemoEditor from '../../../components/common/BlockMemoEditor';

// 타이머 컴포넌트
const TimerDisplay = ({ initialMinutes = 12, isPaused, onFiveMinutesLeft, onTimeUp }) => {
    const [seconds, setSeconds] = useState(initialMinutes * 60);
    const initialSecondsRef = useRef(initialMinutes * 60);
    const fiveMinAlerted = useRef(false);
    const timeUpAlerted = useRef(false);
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setSeconds(s => {
                if (!fiveMinAlerted.current && s === 301) {
                    fiveMinAlerted.current = true;
                    if (onFiveMinutesLeft) onFiveMinutesLeft();
                }
                if (!timeUpAlerted.current && s === 1) {
                    timeUpAlerted.current = true;
                    if (onTimeUp) onTimeUp();
                }
                return s > 0 ? s - 1 : 0;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, onFiveMinutesLeft, onTimeUp]);
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
    const inputRef = useRef(null); // 채팅 입력란 ref 추가

    // --- 커스텀 알림 모달 상태 추가 ---
    const [notificationModal, setNotificationModal] = useState({
        isOpen: false,
        type: 'success', // 'success', 'error', 'confirm'
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
    });

    // 통합된 메모장 state (기존 SOAP 개별 state들을 하나로 통합)
    const [memoContent, setMemoContent] = useState('');

    // --- 커스텀 알림 모달 함수들 ---
    const showNotification = (type, title, message, onConfirm = null, onCancel = null) => {
        setNotificationModal({
            isOpen: true,
            type,
            title,
            message,
            onConfirm,
            onCancel
        });
    };

    const closeNotification = () => {
        setNotificationModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleNotificationConfirm = () => {
        if (notificationModal.onConfirm) {
            notificationModal.onConfirm();
        }
        closeNotification();
    };

    const handleNotificationCancel = () => {
        if (notificationModal.onCancel) {
            notificationModal.onCancel();
        }
        closeNotification();
    };

    // --- 이 useEffect 로직이 핵심적인 수정사항입니다 ---
    useEffect(() => {
        // URL에 sessionId가 있고, 현재 Redux 스토어의 세션 ID와 다르다면
        if (sessionId && sessionId !== currentSessionId) {
            // 세션이 이미 시작되어 있는지 확인
            if (currentSessionId && chatLog.length > 0) {
                // 기존 세션이 있으면 이어하기
                dispatch(resumePracticeSession(sessionId));
            } else {
                // 새로운 세션이면 세션 ID만 설정하고 채팅 기록은 비워둠
                // (PrePracticePage에서 이미 세션이 생성되었으므로)
                // 여기서는 아무것도 하지 않음 - 세션 정보는 이미 Redux에 있음
            }
        } else if (!sessionId && !currentSessionId) {
            // URL에도, 스토어에도 세션 ID가 없는 비정상적인 접근일 경우
            showNotification('error', '오류', '실습 세션 정보가 없습니다. 증례 목록으로 돌아갑니다.');
            setTimeout(() => navigate('/cases'), 2000);
        }
    }, [sessionId, currentSessionId, dispatch, navigate, chatLog.length]);


    // 새 메시지가 추가될 때마다 채팅창을 맨 아래로 스크롤합니다.
    useEffect(() => { 
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); 
    }, [chatLog]);

    // AI 응답이 끝나면 채팅 입력란에 자동 포커스
    useEffect(() => {
        if (!isAiResponding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAiResponding]);

    // 페이지 진입 시에도 포커스
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const [isPaused, setIsPaused] = useState(false);
    const [showFiveMinAlert, setShowFiveMinAlert] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);
    // 채팅기록 숨김/보임 상태 추가
    const [showChatLog, setShowChatLog] = useState(true);

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
        showNotification(
            'confirm', 
            '진료 종료 확인', 
            '정말로 진료를 종료하시겠습니까? 채점이 시작됩니다.',
            () => {
                dispatch(completeSession(sessionId))
                    .unwrap()
                    .then(() => {
                        navigate(`/cases/results/${sessionId}`);
                    })
                    .catch(err => {
                        showNotification('error', '오류', `세션 종료에 실패했습니다: ${err.message}`);
                    });
            }
        );
    };

    useEffect(() => {
        if (showFiveMinAlert) {
            const timer = setTimeout(() => setShowFiveMinAlert(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showFiveMinAlert]);

    if (isLoading && chatLog.length === 0) {
        return <div className="flex justify-center items-center h-screen"><LoadingSpinner text="실습 세션을 준비하는 중..."/></div>;
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] bg-slate-100 font-sans">
            {/* 중앙 메인 패널 (채팅창) */}
            <div className="flex flex-col flex-1 h-full w-full md:w-0">
                <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                    <h1 className="text-xl font-bold text-gray-800">{currentScenario?.name || 'CPX 실습'}</h1>
                    <div className="flex items-center gap-2">
                        <TimerDisplay isPaused={isPaused} onFiveMinutesLeft={() => setShowFiveMinAlert(true)} onTimeUp={() => setIsTimeUp(true)} />
                        {!isPaused ? (
                            <Button onClick={() => setIsPaused(true)} color="secondary" size="sm" disabled={isTimeUp}>일시정지</Button>
                        ) : (
                            <Button onClick={() => setIsPaused(false)} color="primary" size="sm">계속하기</Button>
                        )}
                        {/* 채팅기록 숨김/보임 토글 버튼 */}
                        <Button
                            onClick={() => setShowChatLog(v => !v)}
                            color="secondary"
                            size="sm"
                            className="ml-2"
                        >
                            {showChatLog ? "채팅기록 숨기기" : "채팅기록 보이기"}
                        </Button>
                    </div>
                    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-12 py-6 rounded-2xl shadow-2xl border-2 border-yellow-300 bg-yellow-100 flex items-center gap-4 transition-opacity duration-500 ${showFiveMinAlert ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <span className="text-4xl">⏰</span>
                        <span className="text-yellow-900 font-extrabold text-2xl tracking-wide text-center">
                            실습 시간이 5분 남았습니다!
                        </span>
                    </div>
                </header>
                
                {/* 채팅 로그 조건부 렌더링 */}
                {showChatLog && (
                    <main className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 min-h-[300px]">
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
                )}

                <footer className="p-4 bg-white border-t border-gray-200 shrink-0">
                    {error && <p className="text-red-500 text-sm mb-2 text-center">오류: {error}</p>}
                    <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            disabled={isAiResponding || isPaused || isTimeUp}
                            placeholder="질문 또는 진료 내용을 입력하세요..."
                        />
                        <Button type="submit" disabled={isAiResponding || isPaused || isTimeUp || !userInput.trim()} color="primary">전송</Button>
                    </form>
                </footer>
            </div>

            {/* 우측 사이드바 (메모장) - md 이상에서만 오른쪽, 그 미만에서는 아래 */}
            <aside className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col h-64 md:h-full flex-shrink-0">
                <div className="p-4 border-b border-gray-200"><h2 className="font-bold text-lg text-gray-800">메모장</h2></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <BlockMemoEditor
                        value={memoContent}
                        onChange={setMemoContent}
                        placeholder="실습 중 필요한 내용을 자유롭게 메모하세요..."
                    />
                </div>
                <div className="p-4 mt-auto border-t border-gray-200">
                    <Button onClick={handleEndSession} variant="danger" className="w-full !py-3 text-base">
                        진료 종료
                    </Button>
                </div>
            </aside>

            {/* 커스텀 알림 모달 */}
            <Modal
                isOpen={notificationModal.isOpen}
                onClose={closeNotification}
                title={notificationModal.title}
                footer={
                    notificationModal.type === 'confirm' ? (
                        <>
                            <Button variant="secondary" onClick={handleNotificationCancel}>취소</Button>
                            <Button variant="primary" onClick={handleNotificationConfirm}>확인</Button>
                        </>
                    ) : (
                        <Button 
                            variant={notificationModal.type === 'success' ? 'primary' : 'danger'} 
                            onClick={closeNotification}
                        >
                            확인
                        </Button>
                    )
                }
                onEnter={notificationModal.type === 'confirm' ? handleNotificationConfirm : closeNotification}
            >
                <div className="flex items-center space-x-3">
                    {notificationModal.type === 'success' && (
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    )}
                    {notificationModal.type === 'error' && (
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    )}
                    {notificationModal.type === 'confirm' && (
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    )}
                    <p className="text-gray-700">{notificationModal.message}</p>
                </div>
            </Modal>

            {isTimeUp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-center backdrop-blur">
                    <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4">시간이 종료되었습니다</h2>
                        <p className="mb-6">계속 진행하시겠습니까?</p>
                        <div className="flex gap-4">
                            <Button onClick={() => setIsTimeUp(false)} color="primary">계속하기</Button>
                            <Button onClick={handleEndSession} color="secondary">종료하기</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DuringPracticePage;