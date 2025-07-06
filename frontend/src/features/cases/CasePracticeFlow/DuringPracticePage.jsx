/**
 * @file DuringPracticePage.jsx
 * @description The main page for the interactive CPX practice session with the AI patient.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    PauseIcon, 
    PlayIcon, 
    UserIcon, 
    EyeIcon, 
    EyeSlashIcon 
} from '@heroicons/react/24/outline';
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

// 환자정보 툴팁 컴포넌트
const PatientInfoTooltip = ({ scenario, isVisible }) => {
    const [copySuccess, setCopySuccess] = useState(false);
    const [showCopyTooltip, setShowCopyTooltip] = useState(false);

    if (!isVisible || !scenario) return null;

    // 환자정보를 텍스트로 포맷팅하는 함수
    const formatPatientInfo = () => {
        let info = `[환자 정보]\n`;
        info += `나이/성별: ${scenario.age}세 / ${scenario.sex === 'male' ? '남자' : '여성'}\n`;
        info += `주요 호소: ${scenario.presentingComplaint}\n\n`;
        
        info += `[활력 징후]\n`;
        info += `혈압: ${scenario.bloodPressure}\n`;
        info += `맥박: ${scenario.pulse}\n`;
        info += `호흡: ${scenario.respiration}\n`;
        info += `체온: ${scenario.temperature}\n\n`;
        
        info += `[응시자는 이 환자에게]\n`;
        info += `증상과 관련된 병력을 청취하고, 증상과 관련된 적절한 신체 진찰을 시행한 후, 추정 진단과 향후 진단 계획 등에 대해 환자와 논의하시오\n`;
        
        if (scenario.description) {
            info += `\n[추가 지침]\n${scenario.description}`;
        }
        
        return info;
    };

    // 클립보드에 복사하는 함수
    const handleCopy = async () => {
        try {
            const patientInfo = formatPatientInfo();
            await navigator.clipboard.writeText(patientInfo);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000); // 2초 후 성공 메시지 제거
        } catch (err) {
            console.error('복사에 실패했습니다:', err);
        }
    };

    return (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
            {/* 툴팁 화살표 */}
            <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
            
            <div className="p-4 space-y-4">
                {/* 복사 버튼 */}
                <div className="flex justify-end">
                    <div className="relative">
                        <button
                            onClick={handleCopy}
                            onMouseEnter={() => setShowCopyTooltip(true)}
                            onMouseLeave={() => setShowCopyTooltip(false)}
                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                            {copySuccess ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            )}
                        </button>
                        {/* 툴팁 */}
                        <div className={`absolute top-full right-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none ${
                            showCopyTooltip ? 'opacity-100' : 'opacity-0'
                        }`}>
                            환자내용을 복사해서 메모장에 추가해보세요
                        </div>
                    </div>
                </div>

                {/* 환자 정보 */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">[환자 정보]</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                        <li><strong className="font-medium w-16 inline-block">나이/성별:</strong> {scenario.age}세 / {scenario.sex === 'male' ? '남자' : '여성'}</li>
                        <li><strong className="font-medium w-16 inline-block">주요 호소:</strong> {scenario.presentingComplaint}</li>
                    </ul>
                </div>
                
                {/* 활력 징후 */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">[활력 징후]</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                        <li><span className="font-medium w-12 inline-block">혈압:</span> {scenario.bloodPressure} </li>
                        <li><span className="font-medium w-12 inline-block">맥박:</span> {scenario.pulse} </li>
                        <li><span className="font-medium w-12 inline-block">호흡:</span> {scenario.respiration} </li>
                        <li><span className="font-medium w-12 inline-block">체온:</span> {scenario.temperature} </li>
                    </ul>
                </div>

                {/* 실습 안내 문구 */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">[응시자는 이 환자에게]</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        증상과 관련된 병력을 청취하고, 증상과 관련된 적절한 신체 진찰을 시행한 후, 추정 진단과 향후 진단 계획 등에 대해 환자와 논의하시오
                    </p>
                </div>

                {/* 추가 지침 */}
                {scenario.description && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">[추가 지침]</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {scenario.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
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

    // 환자정보 툴팁 상태
    const [showPatientInfo, setShowPatientInfo] = useState(false);
    const [isPatientInfoLocked, setIsPatientInfoLocked] = useState(false); // 클릭으로 고정된 상태

    // 통합된 메모장 state (기존 SOAP 개별 state들을 하나로 통합)
    const [memoContent, setMemoContent] = useState('');

    // 메모 내용 변경 시 환자정보 자동 닫기
    const handleMemoChange = (newContent) => {
        setMemoContent(newContent);
        // 메모 입력 시 환자정보 자동 닫기
        if (isPatientInfoLocked) {
            setIsPatientInfoLocked(false);
            setShowPatientInfo(false);
        }
    };

    // 세팅 저장 및 복원을 위한 함수들
    const saveSessionSettings = () => {
        if (sessionId) {
            const settings = {
                memoContent,
                showChatLog,
                showDiseaseName,
                timestamp: Date.now()
            };
            localStorage.setItem(`session_settings_${sessionId}`, JSON.stringify(settings));
        }
    };

    const loadSessionSettings = () => {
        if (sessionId) {
            const savedSettings = localStorage.getItem(`session_settings_${sessionId}`);
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

    // 세션 세팅 복원
    useEffect(() => {
        if (sessionId) {
            loadSessionSettings();
        }
    }, [sessionId]);

    // 메모장 내용이 변경될 때마다 세팅 저장
    useEffect(() => {
        if (sessionId && memoContent !== '') {
            const timeoutId = setTimeout(() => {
                saveSessionSettings();
            }, 1000); // 1초 딜레이로 저장
            return () => clearTimeout(timeoutId);
        }
    }, [memoContent, sessionId]);

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
    // 질환명 표시 on/off 상태 추가 (기본값: false)
    const [showDiseaseName, setShowDiseaseName] = useState(false);

    // 채팅 기록 상태가 변경될 때마다 세팅 저장
    useEffect(() => {
        if (sessionId) {
            saveSessionSettings();
        }
    }, [showChatLog, sessionId]);

    // 질환명 표시 상태가 변경될 때마다 세팅 저장
    useEffect(() => {
        if (sessionId) {
            saveSessionSettings();
        }
    }, [showDiseaseName, sessionId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!userInput.trim() || isAiResponding) return;
        
        // 채팅 입력 시 환자정보 자동 닫기
        if (isPatientInfoLocked) {
            setIsPatientInfoLocked(false);
            setShowPatientInfo(false);
        }
        
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
                // 세션 종료 시 저장된 세팅 삭제
                if (sessionId) {
                    localStorage.removeItem(`session_settings_${sessionId}`);
                }
                
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
        <div 
            className="flex flex-col md:flex-row h-[calc(100vh-56px)] bg-slate-100 font-sans"
            onClick={() => {
                // 다른 곳 클릭 시 환자정보 자동 닫기
                if (isPatientInfoLocked) {
                    setIsPatientInfoLocked(false);
                    setShowPatientInfo(false);
                }
            }}
        >
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
                            <h1 className="text-xl font-bold text-gray-800">{currentScenario?.name || 'CPX 실습'}</h1>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <TimerDisplay isPaused={isPaused} onFiveMinutesLeft={() => setShowFiveMinAlert(true)} onTimeUp={() => setIsTimeUp(true)} />
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
                        {/* 환자정보 버튼 */}
                        <div className="relative ml-2 group" onClick={(e) => e.stopPropagation()}>
                            <Button
                                onMouseEnter={() => {
                                    if (!isPatientInfoLocked) {
                                        setShowPatientInfo(true);
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (!isPatientInfoLocked) {
                                        setShowPatientInfo(false);
                                    }
                                }}
                                onClick={() => {
                                    if (isPatientInfoLocked) {
                                        // 고정 해제
                                        setIsPatientInfoLocked(false);
                                        setShowPatientInfo(false);
                                    } else {
                                        // 고정
                                        setIsPatientInfoLocked(true);
                                        setShowPatientInfo(true);
                                    }
                                }}
                                color="secondary"
                                size="sm"
                                className={`flex items-center justify-center ${isPatientInfoLocked ? 'bg-blue-500 text-white' : ''}`}
                            >
                                <UserIcon className="w-4 h-4" />
                            </Button>
                            {/* 툴팁 */}
                            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded transition-opacity duration-200 whitespace-nowrap z-10 ${
                                showPatientInfo ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                                환자정보
                            </div>
                            <PatientInfoTooltip 
                                scenario={currentScenario}
                                isVisible={showPatientInfo}
                            />
                        </div>
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
                        onChange={handleMemoChange}
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
                            <Button onClick={handleEndSession} color="secondary">종료하기</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DuringPracticePage;