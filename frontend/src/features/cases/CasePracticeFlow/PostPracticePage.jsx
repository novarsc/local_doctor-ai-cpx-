/**
 * @file PostPracticePage.jsx
 * @description Page to display feedback and results after a practice session is completed.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedback, clearPracticeSession } from '../../../store/slices/practiceSessionSlice';

// 1. 아코디언 컴포넌트 디자인 개선
const FeedbackAccordion = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-5 font-semibold text-left text-lg text-gray-800 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center">
                  <span className="mr-3">{icon}</span>
                  <span>{title}</span>
                </div>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
            </button>
            {isOpen && <div className="p-5 border-t border-gray-200 text-gray-700">{children}</div>}
        </div>
    );
};

const PostPracticePage = () => {
    const { scenarioId } = useParams();
    const dispatch = useDispatch();
    const { sessionId, currentScenario, feedback, evaluationStatus, chatLog } = useSelector(state => state.practiceSession);

    // ... (useEffect 로직은 기존과 동일)
    useEffect(() => {
      // ...
    }, [dispatch, sessionId, evaluationStatus]);
    
    useEffect(() => {
        return () => {
            dispatch(clearPracticeSession());
        }
    }, [dispatch]);
    
    // ... (로딩 UI는 기존과 동일)
    if (evaluationStatus !== 'completed' || !feedback) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
              {/* ... 로딩 스피너 ... */}
            </div>
        );
    }
    
    return (
      // 2. 전체 레이아웃 구조 개선
        <div className="flex h-screen bg-gray-100">
            <main className="flex-1 overflow-y-auto p-8">
                <header className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900">실습 결과 분석</h1>
                  <p className="text-lg text-gray-500 mt-1">{currentScenario?.name}</p>
                </header>

                {/* 3. 종합 점수 카드 디자인 강조 */}
                <div className="bg-white p-8 rounded-2xl shadow-lg mb-10 text-center">
                    <h2 className="text-xl font-semibold text-gray-500">종합 점수</h2>
                    <p className="text-7xl font-bold text-primary my-3">{feedback.overallScore} <span className="text-4xl text-gray-400">/ 100</span></p>
                    <p className="text-base text-gray-700 max-w-2xl mx-auto">{feedback.qualitativeFeedback}</p>
                </div>

                {/* 4. 상세 피드백 섹션에 아이콘 추가 및 내용 스타일링 */}
                <div>
                    <FeedbackAccordion title="체크리스트 기반 상세 채점 결과" icon="✔️" defaultOpen={true}>
                        <ul className="space-y-4">
                            {feedback.checklistResults?.map((item, i) => (
                                <li key={i} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                      <span className={`font-bold text-lg mr-3 ${item.performance === 'yes' ? 'text-green-500' : 'text-red-500'}`}>
                                        {item.performance === 'yes' ? 'O' : 'X'}
                                      </span>
                                      <span className="flex-1">{item.itemText}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 pl-8 border-l-2 ml-2 border-gray-200">{item.aiComment}</p>
                                </li>
                            ))}
                        </ul>
                    </FeedbackAccordion>
                    <FeedbackAccordion title="잘한 부분" icon="👍">
                         <ul className="list-disc list-inside space-y-2 text-blue-700">
                           {feedback.goodPoints?.map((item, i) => <li key={i}>{item.description}</li>)}
                        </ul>
                    </FeedbackAccordion>
                    <FeedbackAccordion title="개선할 부분" icon="💡">
                         <ul className="list-disc list-inside space-y-2 text-orange-700">
                           {feedback.improvementAreas?.map((item, i) => <li key={i}>{item.description} - {item.advice}</li>)}
                        </ul>
                    </FeedbackAccordion>
                </div>
            </main>

            {/* 5. 우측 사이드바 디자인 통일 */}
            <aside className="w-96 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-bold text-lg text-gray-800">전체 대화 기록</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {chatLog.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-2 text-sm ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white shadow-sm'}`}>
                               {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-4 border-t border-gray-200">
                    <Link to="/cases" className="btn btn-primary w-full text-center block">
                        증례 목록으로 돌아가기
                    </Link>
                </div>
            </aside>
        </div>
    );
};

export default PostPracticePage;