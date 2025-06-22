/**
 * @file MockExamInProgressPage.jsx
 * @description Page for conducting a mock exam with actual chat interface for case practice.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMockExamSession, completeMockExam } from '../../store/slices/mockExamSlice';
import { 
  addUserMessage, 
  appendAiMessageChunk, 
  endAiResponse,
  setPracticeError,
  completeSession,
  resumePracticeSession,
  startPracticeSession,
  resetSession
} from '../../store/slices/practiceSessionSlice';
import { practiceSessionService } from '../../services/practiceSessionService';
import { mockExamService } from '../../services/mockExamService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

const MockExamInProgressPage = () => {
    const { mockExamSessionId, caseNumber } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentSession, status, error } = useSelector(state => state.mockExam);
    const currentPracticeSessionId = useSelector(state => state.practiceSession.sessionId);
    const currentScenario = useSelector(state => state.practiceSession.currentScenario);
    const chatLog = useSelector(state => state.practiceSession.chatLog);
    const isAiResponding = useSelector(state => state.practiceSession.isAiResponding);
    const isLoading = useSelector(state => state.practiceSession.isLoading);
    const practiceError = useSelector(state => state.practiceSession.error);
    
    const [currentCase, setCurrentCase] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [isStartingPractice, setIsStartingPractice] = useState(false);
    const chatEndRef = useRef(null);
    const caseIndex = parseInt(caseNumber, 10) - 1;

    // 모의고사 세션 정보 로드
    useEffect(() => {
        if (!currentSession || currentSession.mockExamSessionId !== mockExamSessionId) {
            dispatch(fetchMockExamSession(mockExamSessionId));
        }
        
        // 컴포넌트 언마운트 시 실습 세션 상태 정리
        return () => {
            dispatch(resetSession());
        };
    }, [dispatch, mockExamSessionId, currentSession]);

    // 현재 증례 정보 설정
    useEffect(() => {
        if (currentSession?.selectedScenariosDetails) {
            const caseDetails = currentSession.selectedScenariosDetails[caseIndex];
            if (caseDetails) {
                setCurrentCase(caseDetails);
            } else {
                navigate('/mock-exams');
            }
        }
    }, [currentSession, caseIndex, navigate]);

    // 실습 세션 시작
    useEffect(() => {
        if (currentCase && !currentPracticeSessionId && !isStartingPractice) {
            setIsStartingPractice(true);
            startPracticeSessionForCase();
        }
    }, [currentCase, currentPracticeSessionId, isStartingPractice]);

    // 새 메시지가 추가될 때마다 채팅창을 맨 아래로 스크롤
    useEffect(() => { 
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [chatLog]);

    const startPracticeSessionForCase = async () => {
        try {
            console.log('Starting practice session for case:', caseNumber);
            const result = await mockExamService.startCasePractice(mockExamSessionId, caseNumber);
            console.log('Practice session result:', result);
            
            if (result.isResumed) {
                // 기존 세션 이어하기
                console.log('Resuming existing session');
                dispatch(resumePracticeSession(result.practiceSessionId));
            } else {
                // 새 세션 시작
                console.log('Starting new session');
                dispatch(startPracticeSession({
                    sessionId: result.practiceSessionId,
                    scenarioId: result.scenarioId,
                    scenarioName: result.scenarioName
                }));
            }
        } catch (error) {
            console.error('Failed to start practice session:', error);
            alert('실습 세션 시작에 실패했습니다.');
        } finally {
            setIsStartingPractice(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        console.log('handleSendMessage called', { userInput, isAiResponding, currentPracticeSessionId });
        
        if (!userInput.trim() || isAiResponding || !currentPracticeSessionId) {
            console.log('Message not sent:', { 
                hasInput: !!userInput.trim(), 
                isAiResponding, 
                hasSessionId: !!currentPracticeSessionId 
            });
            return;
        }
        
        console.log('Dispatching addUserMessage with:', userInput);
        dispatch(addUserMessage(userInput));
        
        practiceSessionService.sendChatMessageAndStream({
            sessionId: currentPracticeSessionId,
            messageContent: userInput,
            onData: (data) => {
                console.log('Received data:', data);
                if (data.chunk) {
                    dispatch(appendAiMessageChunk({ chunk: data.chunk }));
                } else if (data.error) {
                    dispatch(setPracticeError(data.error.message));
                }
            },
            onEnd: () => {
                console.log('Stream ended');
                dispatch(endAiResponse());
            },
            onError: (err) => {
                console.error('Stream error:', err);
                dispatch(setPracticeError(err.toString()));
            },
        });
        
        setUserInput('');
    };
    
    const handleEndCase = () => {
        if (window.confirm('정말로 이 증례를 종료하시겠습니까? 다음 증례로 넘어갑니다.')) {
            const nextCaseNumber = parseInt(caseNumber, 10) + 1;
            
            if (nextCaseNumber > 6) {
                // 마지막 증례이므로 현재 실습 세션을 먼저 완료하고 모의고사 완료
                if (currentPracticeSessionId) {
                    dispatch(completeSession(currentPracticeSessionId))
                        .unwrap()
                        .then(() => {
                            // 실습 세션 완료 후 모의고사 완료
                            return dispatch(completeMockExam(mockExamSessionId)).unwrap();
                        })
                        .then(() => {
                            navigate(`/mock-exams/results/${mockExamSessionId}`);
                        })
                        .catch((err) => {
                            alert(`모의고사 완료에 실패했습니다: ${err.message}`);
                        });
                } else {
                    // 실습 세션이 없는 경우 바로 모의고사 완료
                    dispatch(completeMockExam(mockExamSessionId))
                        .unwrap()
                        .then(() => {
                            navigate(`/mock-exams/results/${mockExamSessionId}`);
                        })
                        .catch((err) => {
                            alert(`모의고사 완료에 실패했습니다: ${err.message}`);
                        });
                }
            } else {
                // 다음 증례로 이동하기 전에 현재 실습 세션 상태 초기화
                dispatch(resetSession());
                // 다음 증례로 이동
                navigate(`/mock-exams/live/${mockExamSessionId}/${nextCaseNumber}`);
            }
        }
    };

    if (status === 'loading' || !currentCase || isStartingPractice) {
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="모의고사 정보를 불러오는 중입니다..."/></div>;
    }

    if (status === 'error') {
        return <div className="flex items-center justify-center h-screen text-red-500">오류가 발생했습니다: {error}</div>;
    }

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            {/* 중앙 메인 패널 (채팅창) */}
            <div className="flex flex-col flex-grow h-full">
                <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-800">모의고사 진행 중</h1>
                        <div className="text-lg font-semibold bg-blue-100 text-blue-700 px-4 py-1 rounded-full">
                            증례 {caseNumber} / 6
                        </div>
                    </div>
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
                    {practiceError && <p className="text-red-500 text-sm mb-2 text-center">오류: {practiceError}</p>}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input 
                            type="text" 
                            value={userInput} 
                            onChange={(e) => setUserInput(e.target.value)} 
                            placeholder={isAiResponding ? "AI가 응답 중입니다..." : "여기에 메시지를 입력하세요..."} 
                            className="input-base flex-1 !p-3"
                            disabled={isAiResponding || !currentPracticeSessionId} 
                        />
                        <Button
                            type="submit" 
                            disabled={isAiResponding || !userInput.trim() || !currentPracticeSessionId} 
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
                    <Button onClick={handleEndCase} variant="danger" className="w-full !py-3 text-base">
                        증례 종료
                    </Button>
                </div>
            </aside>
        </div>
    );
};

export default MockExamInProgressPage;