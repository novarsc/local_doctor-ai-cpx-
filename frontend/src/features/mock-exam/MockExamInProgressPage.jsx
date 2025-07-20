/**
 * @file MockExamInProgressPage.jsx
 * @description Page for conducting a mock exam with actual chat interface for case practice.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMockExamSession, completeMockExam, clearCurrentMockExam } from '../../store/slices/mockExamSlice';
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
import Modal from '../../components/common/Modal';
import BlockMemoEditor from '../../components/common/BlockMemoEditor';
import { 
    PauseIcon, 
    PlayIcon, 
    UserIcon, 
    EyeIcon, 
    EyeSlashIcon 
} from '@heroicons/react/24/outline';

// 타임아웃 유틸 함수 추가 (컴포넌트 상단에 위치)
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

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
    const inputRef = useRef(null);
    const caseIndex = parseInt(caseNumber, 10) - 1;
    const [memoContent, setMemoContent] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [showFiveMinAlert, setShowFiveMinAlert] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [showChatLog, setShowChatLog] = useState(true);
    
    // --- DuringPracticePage에서 추가된 상태들 ---
    const [showDiseaseName, setShowDiseaseName] = useState(false);
    const [isPatientInfoExpanded, setIsPatientInfoExpanded] = useState(false);

    // --- 커스텀 알림 모달 상태 추가 ---
    const [notificationModal, setNotificationModal] = useState({
        isOpen: false,
        type: 'success', // 'success', 'error', 'confirm'
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
    });

    // --- 세션 설정 저장/복원 함수들 ---
    const saveSessionSettings = () => {
        if (mockExamSessionId && caseNumber) {
            const settings = {
                memoContent,
                showChatLog,
                showDiseaseName,
                timestamp: Date.now()
            };
            localStorage.setItem(`mock_exam_settings_${mockExamSessionId}_${caseNumber}`, JSON.stringify(settings));
        }
    };

    const loadSessionSettings = () => {
        if (mockExamSessionId && caseNumber) {
            const savedSettings = localStorage.getItem(`mock_exam_settings_${mockExamSessionId}_${caseNumber}`);
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);
                    if (settings.memoContent !== undefined) {
                        setMemoContent(settings.memoContent);
                    }
                    if (settings.showChatLog !== undefined) {
                        setShowChatLog(settings.showChatLog);
                    }
                    if (settings.showDiseaseName !== undefined) {
                        setShowDiseaseName(settings.showDiseaseName);
                    }
                } catch (error) {
                    console.error('저장된 세션 세팅을 불러오는데 실패했습니다:', error);
                }
            }
        }
    };

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
        setNotificationModal({
            isOpen: false,
            type: 'success',
            title: '',
            message: '',
            onConfirm: null,
            onCancel: null
        });
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

    // --- 메모 내용 변경 핸들러 ---
    const handleMemoChange = (newContent) => {
        setMemoContent(newContent);
    };

    // 모의고사 세션 정보 로드
    useEffect(() => {
        console.log('모의고사 세션 로드 useEffect 실행:', {
            hasCurrentSession: !!currentSession,
            currentSessionId: currentSession?.mockExamSessionId,
            urlMockExamSessionId: mockExamSessionId,
            status,
            needsRefetch: (!currentSession || currentSession.mockExamSessionId !== mockExamSessionId) && status !== 'loading'
        });
        
        // 이미 올바른 세션이 로드되어 있는지 확인
        if ((!currentSession || currentSession.mockExamSessionId !== mockExamSessionId) && status !== 'loading') {
            console.log('모의고사 세션 정보 다시 로드:', mockExamSessionId);
            dispatch(fetchMockExamSession(mockExamSessionId));
        }
        
        // 페이지 로드 시 스크롤을 맨 위로 올림
        window.scrollTo(0, 0);
        
        // 컴포넌트 언마운트 시 실습 세션 상태 정리 (모의고사 완전 종료 시에만)
        return () => {
            // 모의고사 진행 중 페이지 이동은 정상적인 흐름이므로 상태를 유지
            const currentPath = window.location.pathname;
            console.log('컴포넌트 언마운트:', { currentPath, shouldReset: !currentPath.includes('/mock-exams/live/') });
            if (!currentPath.includes('/mock-exams/live/')) {
                dispatch(resetSession());
            }
        };
    }, [dispatch, mockExamSessionId]);

    // 현재 증례 정보 설정
    useEffect(() => {
        console.log('현재 증례 정보 설정 useEffect 실행:', {
            hasCurrentSession: !!currentSession,
            mockExamSessionId: currentSession?.mockExamSessionId,
            caseIndex,
            caseNumber,
            selectedScenariosDetailsLength: currentSession?.selectedScenariosDetails?.length
        });
        
        if (currentSession?.selectedScenariosDetails) {
            const caseDetails = currentSession.selectedScenariosDetails[caseIndex];
            console.log('케이스 상세 정보:', { caseIndex, caseDetails, allCases: currentSession.selectedScenariosDetails });
            
            if (caseDetails) {
                console.log('케이스 정보 설정 성공:', caseDetails);
                setCurrentCase(caseDetails);
            } else {
                console.error('케이스를 찾을 수 없어 /mock-exams로 리다이렉션:', { caseIndex, totalCases: currentSession.selectedScenariosDetails.length });
                navigate('/mock-exams');
            }
        } else {
            console.log('currentSession 또는 selectedScenariosDetails가 없음');
        }
    }, [currentSession?.selectedScenariosDetails, caseIndex, navigate, caseNumber]);

    // 실습 세션 시작
    useEffect(() => {
        console.log('실습 세션 시작 useEffect 실행:', {
            hasCurrentCase: !!currentCase,
            currentCaseName: currentCase?.name,
            hasPracticeSessionId: !!currentPracticeSessionId,
            isStartingPractice,
            sessionMatches: currentSession?.mockExamSessionId === mockExamSessionId,
            mockExamSessionId,
            currentSessionId: currentSession?.mockExamSessionId
        });
        
        // 페이지가 변경되는 중이 아니고, 현재 케이스가 있으며, 실습 세션이 없고, 시작 중이 아닐 때만 시작
        if (currentCase && !currentPracticeSessionId && !isStartingPractice && 
            currentSession && currentSession.mockExamSessionId === mockExamSessionId) {
            console.log('실습 세션 시작 조건 충족, 시작합니다.');
            setIsStartingPractice(true);
            startPracticeSessionForCase();
        } else {
            console.log('실습 세션 시작 조건 미충족');
        }
    }, [currentCase, currentPracticeSessionId, isStartingPractice, mockExamSessionId, currentSession]);

    // 새 메시지가 추가될 때마다 채팅창을 맨 아래로 스크롤
    useEffect(() => { 
        if (chatEndRef.current && chatLog.length > 0) {
            // 약간의 지연을 두어 DOM 업데이트 완료 후 스크롤
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [chatLog]);

    // AI 응답이 끝나면 채팅 입력란에 자동 포커스
    useEffect(() => {
        if (!isAiResponding && inputRef.current && currentPracticeSessionId) {
            inputRef.current.focus();
        }
    }, [isAiResponding, currentPracticeSessionId]);

    // 실습 세션이 시작되면 포커스
    useEffect(() => {
        if (currentPracticeSessionId && inputRef.current && !isStartingPractice) {
            inputRef.current.focus();
        }
    }, [currentPracticeSessionId, isStartingPractice]);

    useEffect(() => {
        if (showFiveMinAlert) {
            const timer = setTimeout(() => setShowFiveMinAlert(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showFiveMinAlert]);

    const startPracticeSessionForCase = async () => {
        try {
            console.log('Starting practice session for case:', caseNumber);
            
            // 중복 시작 방지: 이미 동일한 케이스로 세션이 진행 중인 경우
            if (currentPracticeSessionId && currentScenario?.scenarioId === currentCase?.scenarioId) {
                console.log('Session already exists for this case, skipping');
                setIsStartingPractice(false);
                return;
            }
            
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
            showNotification('error', '오류', '실습 세션 시작에 실패했습니다.');
        } finally {
            setIsStartingPractice(false);
        }
    };

    // 세션 세팅 복원
    useEffect(() => {
        if (mockExamSessionId && caseNumber) {
            loadSessionSettings();
        }
    }, [mockExamSessionId, caseNumber]);

    // 메모장 내용이 변경될 때마다 세팅 저장
    useEffect(() => {
        if (mockExamSessionId && caseNumber && memoContent !== '') {
            const timeoutId = setTimeout(() => {
                saveSessionSettings();
            }, 1000); // 1초 딜레이로 저장
            return () => clearTimeout(timeoutId);
        }
    }, [memoContent, mockExamSessionId, caseNumber]);

    // 채팅 기록 상태가 변경될 때마다 세팅 저장
    useEffect(() => {
        if (mockExamSessionId && caseNumber) {
            saveSessionSettings();
        }
    }, [showChatLog, mockExamSessionId, caseNumber]);

    // 질환명 표시 상태가 변경될 때마다 세팅 저장
    useEffect(() => {
        if (mockExamSessionId && caseNumber) {
            saveSessionSettings();
        }
    }, [showDiseaseName, mockExamSessionId, caseNumber]);

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
        // 세션 종료 시 저장된 세팅 삭제
        if (mockExamSessionId && caseNumber) {
            localStorage.removeItem(`mock_exam_settings_${mockExamSessionId}_${caseNumber}`);
        }

        showNotification(
            'confirm', 
            '증례 종료 확인', 
            '정말로 이 증례를 종료하시겠습니까? 다음 증례로 넘어갑니다.',
            () => {
                const nextCaseNumber = parseInt(caseNumber, 10) + 1;
                console.log('handleEndCase called:', { nextCaseNumber, currentPracticeSessionId, mockExamSessionId });
                
                if (nextCaseNumber > 6) {
                    // 마지막 증례이므로 현재 실습 세션을 먼저 완료하고 모의고사 완료
                    if (currentPracticeSessionId) {
                        console.log('Completing practice session first:', currentPracticeSessionId);
                        dispatch(completeSession(currentPracticeSessionId))
                            .unwrap()
                            .then(() => {
                                console.log('Practice session completed, now completing mock exam');
                                // 실습 세션 완료 후 모의고사 완료 (타임아웃 적용)
                                return withTimeout(dispatch(completeMockExam(mockExamSessionId)).unwrap(), 10000);
                            })
                            .catch((err) => {
                                console.error('Error or timeout completing mock exam:', err);
                                showNotification('error', '오류', `모의고사 완료에 실패했거나 시간이 초과되었습니다: ${err.message}`);
                            })
                            .finally(() => {
                                console.log('navigate 호출!', { mockExamSessionId, caseNumber, status });
                                setTimeout(() => {
                                    if (mockExamSessionId) {
                                        navigate(`/mock-exams/results/${mockExamSessionId}`);
                                        setTimeout(() => {
                                            if (window.location.pathname !== `/mock-exams/results/${mockExamSessionId}`) {
                                                window.location.href = `/mock-exams/results/${mockExamSessionId}`;
                                            }
                                        }, 1500);
                                    } else {
                                        alert('mockExamSessionId가 올바르지 않습니다!');
                                    }
                                }, 1000);
                            });
                    } else {
                        console.log('No practice session, completing mock exam directly');
                        // 실습 세션이 없는 경우 바로 모의고사 완료 (타임아웃 적용)
                        withTimeout(dispatch(completeMockExam(mockExamSessionId)).unwrap(), 10000)
                            .catch((err) => {
                                console.error('Error or timeout completing mock exam:', err);
                                showNotification('error', '오류', `모의고사 완료에 실패했거나 시간이 초과되었습니다: ${err.message}`);
                            })
                            .finally(() => {
                                console.log('navigate 호출!', { mockExamSessionId, caseNumber, status });
                                setTimeout(() => {
                                    if (mockExamSessionId) {
                                        navigate(`/mock-exams/results/${mockExamSessionId}`);
                                        setTimeout(() => {
                                            if (window.location.pathname !== `/mock-exams/results/${mockExamSessionId}`) {
                                                window.location.href = `/mock-exams/results/${mockExamSessionId}`;
                                            }
                                        }, 1500);
                                    } else {
                                        alert('mockExamSessionId가 올바르지 않습니다!');
                                    }
                                }, 1000);
                            });
                    }
                } else {
                    console.log('Moving to next case:', nextCaseNumber);
                    // 다음 증례로 이동하기 전에 현재 실습 세션을 완료 처리
                    if (currentPracticeSessionId) {
                        console.log('Completing practice session before moving to next case:', currentPracticeSessionId);
                        dispatch(completeSession(currentPracticeSessionId))
                            .unwrap()
                            .then(() => {
                                console.log('Practice session completed, moving to next case');
                                // 실습 세션 상태 초기화 후 다음 증례로 이동
                                dispatch(resetSession());
                                navigate(`/mock-exams/pre-practice/${mockExamSessionId}/${nextCaseNumber}`);
                            })
                            .catch((err) => {
                                console.error('Error completing practice session:', err);
                                // 에러가 발생해도 실습 세션 상태 초기화 후 다음 증례로 이동
                                dispatch(resetSession());
                                navigate(`/mock-exams/pre-practice/${mockExamSessionId}/${nextCaseNumber}`);
                            });
                    } else {
                        console.log('No practice session to complete, moving to next case directly');
                        // 실습 세션이 없는 경우에도 상태 초기화 후 다음 증례로 이동
                        dispatch(resetSession());
                        navigate(`/mock-exams/pre-practice/${mockExamSessionId}/${nextCaseNumber}`);
                    }
                }
            }
        );
    };

    // 렌더링 상태 체크 로그 제거 (무한 리렌더링 방지)

    if (status === 'loading' || !currentCase || isStartingPractice) {
        // 마지막 6번째 실습을 마치고 채점 대기 상태라면 안내 메시지 변경
        if (parseInt(caseNumber, 10) === 6 && status === 'loading') {
            return (
                <div className="flex items-center justify-center h-screen">
                    <LoadingSpinner text="AI 평가가 완료되는 중입니다. 최대 5분이 소요될 수 있습니다. 전체 채점이 완료되면 자동으로 결과 페이지로 이동됩니다!" />
                </div>
            );
        }
        // 그 외 기존 메시지
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="모의고사 정보를 불러오는 중입니다..."/></div>;
    }

    if (status === 'error') {
        console.error('에러 상태로 렌더링:', error);
        return <div className="flex items-center justify-center h-screen text-red-500">오류가 발생했습니다: {error}</div>;
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] bg-slate-100 font-sans">
            {/* 중앙 메인 패널 (채팅창) */}
            <div className="flex flex-col flex-1 h-full w-full md:w-0">
                <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        {/* 질환명 표시 스위치 */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">질환명</span>
                            <button
                                onClick={() => setShowDiseaseName(v => !v)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    showDiseaseName ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                                role="switch"
                                aria-checked={showDiseaseName}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        showDiseaseName ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        {showDiseaseName && (
                            <h1 className="text-xl font-bold text-gray-800">{currentCase?.name || '모의고사 증례'}</h1>
                        )}
                        <div className="text-lg font-semibold bg-blue-100 text-blue-700 px-4 py-1 rounded-full">
                            증례 {caseNumber} / 6
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TimerDisplay initialMinutes={12} isPaused={isPaused} onFiveMinutesLeft={() => setShowFiveMinAlert(true)} onTimeUp={() => setIsTimeUp(true)} />
                        {!isPaused ? (
                            <div className="relative group">
                                <Button 
                                    onClick={() => setIsPaused(true)} 
                                    color="secondary" 
                                    size="sm" 
                                    disabled={isTimeUp}
                                    className="flex items-center justify-center"
                                >
                                    <PauseIcon className="w-4 h-4" />
                                </Button>
                                {/* 툴팁 */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    일시정지
                                </div>
                            </div>
                        ) : (
                            <div className="relative group">
                                <Button 
                                    onClick={() => setIsPaused(false)} 
                                    color="primary" 
                                    size="sm"
                                    className="flex items-center justify-center"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                </Button>
                                {/* 툴팁 */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    계속하기
                                </div>
                            </div>
                        )}
                        {/* 채팅기록 on/off 스위치 */}
                        <div className="flex items-center gap-2 ml-2">
                            <span className="text-sm text-gray-600 hidden sm:inline">채팅</span>
                            <button
                            onClick={() => setShowChatLog(v => !v)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    showChatLog ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                                role="switch"
                                aria-checked={showChatLog}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        showChatLog ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                                {showChatLog ? (
                                    <EyeIcon className="absolute left-1 w-3 h-3 text-white" />
                                ) : (
                                    <EyeSlashIcon className="absolute right-1 w-3 h-3 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-12 py-6 rounded-2xl shadow-2xl border-2 border-yellow-300 bg-yellow-100 flex items-center gap-4 transition-opacity duration-500 ${showFiveMinAlert ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <span className="text-4xl">⏰</span>
                        <span className="text-yellow-900 font-extrabold text-2xl tracking-wide text-center">
                            실습 시간이 5분 남았습니다!
                        </span>
                    </div>
                </header>
                
                {/* 채팅 로그 - 블러 처리 방식으로 변경 */}
                <main className={`flex-1 min-h-0 overflow-y-auto p-6 space-y-5 min-h-[300px] transition-all duration-300 ${!showChatLog ? 'filter blur-md pointer-events-none' : ''}`}>
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

                <footer className="p-4 bg-white border-t border-gray-200 shrink-0">
                    {practiceError && <p className="text-red-500 text-sm mb-2 text-center">오류: {practiceError}</p>}
                    <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                        <input 
                            ref={inputRef}
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            disabled={isAiResponding || isPaused || isTimeUp || !currentPracticeSessionId}
                            placeholder={isAiResponding ? "AI가 응답 중입니다..." : "여기에 메시지를 입력하세요..."}
                        />
                        <Button
                            type="submit" 
                            disabled={isAiResponding || isPaused || isTimeUp || !userInput.trim() || !currentPracticeSessionId} 
                            color="primary"
                        >
                            전송
                        </Button>
                    </form>
                </footer>
            </div>

            {/* 우측 사이드바 (메모장) - md 이상에서만 오른쪽, 그 미만에서는 아래 */}
            <aside className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col h-64 md:h-full flex-shrink-0">
                {/* 환자정보 박스 - 메모장 위에 추가 */}
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                    <button 
                        onClick={() => setIsPatientInfoExpanded(!isPatientInfoExpanded)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                            환자정보
                        </h2>
                        <svg 
                            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isPatientInfoExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    
                    {/* 환자정보 내용 - 접힘/펼침 상태에 따라 표시 */}
                    <div className={`overflow-hidden transition-all duration-300 ${isPatientInfoExpanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                        {currentCase ? (
                            <div className="space-y-3 text-sm">
                                {/* 환자 정보 */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-1">[환자 정보]</h3>
                                    <ul className="space-y-1 text-gray-700">
                                        <li><strong className="font-medium w-16 inline-block">나이/성별:</strong> {currentCase.age}세 / {currentCase.sex === 'male' ? '남자' : '여성'}</li>
                                        <li><strong className="font-medium w-16 inline-block">주요 호소:</strong> {currentCase.presentingComplaint}</li>
                                    </ul>
                                </div>
                                
                                {/* 활력 징후 */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-1">[활력 징후]</h3>
                                    <ul className="space-y-1 text-gray-700">
                                        <li><span className="font-medium w-12 inline-block">혈압:</span> {currentCase.bloodPressure} </li>
                                        <li><span className="font-medium w-12 inline-block">맥박:</span> {currentCase.pulse} </li>
                                        <li><span className="font-medium w-12 inline-block">호흡:</span> {currentCase.respiration} </li>
                                        <li><span className="font-medium w-12 inline-block">체온:</span> {currentCase.temperature} </li>
                                    </ul>
                                </div>

                                {/* 실습 안내 문구 */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-1">[응시자는 이 환자에게]</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        증상과 관련된 병력을 청취하고, 증상과 관련된 적절한 신체 진찰을 시행한 후, 추정 진단과 향후 진단 계획 등에 대해 환자와 논의하시오
                                    </p>
                                </div>

                                {/* 추가 지침 */}
                                {currentCase.description && (
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-1">[추가 지침]</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {currentCase.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">환자정보를 불러오는 중...</p>
                        )}
                    </div>
                </div>
                
                 <div className="p-4 border-b border-gray-200"><h2 className="font-bold text-lg text-gray-800">메모장</h2></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <BlockMemoEditor
                        value={memoContent}
                        onChange={handleMemoChange}
                        placeholder="실습 중 필요한 내용을 자유롭게 메모하세요..."
                    />
                </div>
                <div className="p-4 mt-auto border-t border-gray-200">
                    <Button onClick={handleEndCase} variant="danger" className="w-full !py-3 text-base">
                        증례 종료
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

            {/* 일시정지 상태일 때 블러 처리 및 팝업 */}
            {isPaused && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-center backdrop-blur">
                    <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4">실습이 일시정지되었습니다</h2>
                        <p className="mb-6">계속 진행하시겠습니까?</p>
                        <div className="flex gap-4">
                        <Button onClick={() => setIsPaused(false)} color="primary">계속하기</Button>
                        </div>
                    </div>
                </div>
            )}

            {isTimeUp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-center backdrop-blur">
                    <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4">시간이 종료되었습니다</h2>
                        <p className="mb-6">계속 진행하시겠습니까?</p>
                        <div className="flex gap-4">
                            <Button onClick={() => setIsTimeUp(false)} color="primary">계속하기</Button>
                            <Button onClick={handleEndCase} color="secondary">종료하기</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockExamInProgressPage;