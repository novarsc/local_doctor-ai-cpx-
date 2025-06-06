/**
 * @file PostPracticePage.jsx
 * @description Page to display feedback and results after a practice session is completed.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedback, clearPracticeSession } from '../../../store/slices/practiceSessionSlice';

const FeedbackAccordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border rounded-lg mb-2">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 font-semibold text-left bg-gray-50 hover:bg-gray-100">
                <span>{title}</span>
                <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="p-4 border-t">{children}</div>}
        </div>
    );
};

const PostPracticePage = () => {
    const { scenarioId } = useParams();
    const dispatch = useDispatch();
    const { sessionId, currentScenario, feedback, evaluationStatus, chatLog } = useSelector(state => state.practiceSession);

    // Poll for feedback every 5 seconds if it's still evaluating
    useEffect(() => {
        if (sessionId && evaluationStatus !== 'completed') {
            dispatch(fetchFeedback(sessionId));

            const interval = setInterval(() => {
                if (evaluationStatus === 'evaluating' || evaluationStatus === 'loading') {
                     dispatch(fetchFeedback(sessionId));
                }
            }, 5000); // Poll every 5 seconds

            return () => clearInterval(interval);
        }
    }, [dispatch, sessionId, evaluationStatus]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(clearPracticeSession());
        }
    }, [dispatch]);
    

    if (evaluationStatus !== 'completed' || !feedback) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="text-center">
                     <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <h1 className="text-2xl font-bold text-gray-800">채점 진행 중</h1>
                    <p className="text-gray-600 mt-2">AI가 실습 내용을 분석하고 있습니다. 잠시만 기다려주세요.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex h-screen bg-gray-100">
             {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-bold text-gray-900">실습 결과 분석</h1>
                <p className="text-gray-600 mb-6">{currentScenario?.name}</p>

                {/* Summary Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8 text-center">
                    <h2 className="text-lg font-semibold text-gray-500">종합 점수</h2>
                    <p className="text-6xl font-bold text-blue-600 my-2">{feedback.overallScore} <span className="text-3xl text-gray-500">/ 100</span></p>
                    <p className="text-gray-700">{feedback.qualitativeFeedback}</p>
                </div>

                {/* Detailed Feedback Section */}
                <div>
                    <FeedbackAccordion title="✔️ 체크리스트 기반 상세 채점 결과" defaultOpen={true}>
                        <ul className="space-y-2">
                            {feedback.checklistResults?.map((item, i) => (
                                <li key={i} className="p-2 bg-gray-50 rounded-md">{item.itemText}: <span className="font-bold">{item.performance}</span> - {item.aiComment}</li>
                            ))}
                        </ul>
                    </FeedbackAccordion>
                    <FeedbackAccordion title="👍 잘한 부분">
                        <ul className="space-y-2">
                           {feedback.goodPoints?.map((item, i) => <li key={i} className="p-2">{item.description}</li>)}
                        </ul>
                    </FeedbackAccordion>
                    <FeedbackAccordion title="💡 개선할 부분">
                         <ul className="space-y-2">
                           {feedback.improvementAreas?.map((item, i) => <li key={i} className="p-2">{item.description} - {item.advice}</li>)}
                        </ul>
                    </FeedbackAccordion>
                </div>
            </main>

            {/* Right Sidebar for Chat Log */}
            <aside className="w-96 bg-white border-l flex-shrink-0 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg">전체 대화 기록</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatLog.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-2 text-sm ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-800'}`}>
                               {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-4 border-t">
                    <Link to="/cases" className="w-full text-center block px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
                        증례 목록으로 돌아가기
                    </Link>
                </div>
            </aside>
        </div>
    );
};

export default PostPracticePage;
