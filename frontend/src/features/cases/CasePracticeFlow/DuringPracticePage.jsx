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
} from '../../../store/slices/practiceSessionSlice';

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
    const { scenarioId } = useParams();
    const { sessionId, currentScenario, chatLog, isAiResponding, error } = useSelector(state => state.practiceSession);
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!userInput.trim() || isAiResponding) return;
        dispatch(addUserMessage(userInput));
        practiceSessionService.sendChatMessageAndStream({
            sessionId,
            messageContent: userInput,
            onData: (data) => {
                if (data.chunk) dispatch(appendAiMessageChunk({ chunk: data.chunk }));
                else if (data.error) dispatch(setPracticeError(data.error.message));
            },
            onEnd: () => dispatch(endAiResponse()),
            onError: (err) => dispatch(setPracticeError(err.toString())),
        });
        setUserInput('');
    };
    
    const handleEndSession = () => {
        if (window.confirm('정말로 진료를 종료하시겠습니까? 채점이 시작됩니다.')) {
            dispatch(completeSession(sessionId)).then(() => {
                navigate(`/cases/${scenarioId}/practice/result`);
            });
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <div className="flex flex-col flex-grow h-full">
                <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
                    <h1 className="text-xl font-bold text-gray-800">{currentScenario?.name || 'CPX 실습'}</h1>
                    <TimerDisplay />
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatLog.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0"></div>}
                            <div className={`px-4 py-2 rounded-xl max-w-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}><p className="text-sm">{msg.content}</p></div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </main>
                <footer className="p-4 bg-white border-t">
                    {error && <p className="text-red-500 text-sm mb-2">오류: {error}</p>}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                        <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={isAiResponding ? "AI가 응답 중입니다..." : "여기에 메시지를 입력하세요..."} className="flex-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isAiResponding} />
                        <button type="submit" disabled={isAiResponding || !userInput.trim()} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition">전송</button>
                    </form>
                </footer>
            </div>
            <aside className="w-96 bg-white border-l flex flex-col h-full flex-shrink-0">
                 <div className="p-4 border-b"><h2 className="font-bold text-lg">메모장</h2></div>
                <textarea placeholder="실습 중 필요한 내용을 메모하세요..." className="w-full h-full p-4 text-sm focus:outline-none resize-none"></textarea>
                <div className="p-4 mt-auto border-t">
                    <button onClick={handleEndSession} className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">진료 종료</button>
                </div>
            </aside>
        </div>
    );
};

export default DuringPracticePage;
