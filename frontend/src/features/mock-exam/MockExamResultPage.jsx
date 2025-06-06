/**
 * @file MockExamResultPage.jsx
 * @description Page to display the final results of a mock exam session.
 */

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCurrentMockExam } from '../../store/slices/mockExamSlice';

const MockExamResultPage = () => {
    const dispatch = useDispatch();
    const { mockExamSessionId } = useParams();
    const { currentSession, status, error } = useSelector(state => state.mockExam);

    useEffect(() => {
        // Clean up the session data when the user navigates away from the results.
        return () => {
            dispatch(clearCurrentMockExam());
        }
    }, [dispatch]);


    if (status === 'loading') {
        return <div className="p-8 text-center">결과를 불러오는 중입니다...</div>;
    }

    if (status === 'error' || !currentSession) {
        return <div className="p-8 text-center text-red-500">결과를 표시하는 중 오류가 발생했습니다: {error || '세션 정보를 찾을 수 없습니다.'}</div>;
    }
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">모의고사 결과</h1>
                    <p className="text-gray-600 mt-2">응시일: {new Date(currentSession.startTime).toLocaleString()}</p>
                </header>

                {/* Overall Score */}
                <div className="bg-white p-8 rounded-xl shadow-lg mb-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-500">종합 평균 점수</h2>
                    <p className="text-7xl font-bold text-blue-600 my-3">{currentSession.overallScore ?? 'N/A'}</p>
                    <p className="text-gray-700">6개 증례의 평균 점수입니다.</p>
                </div>

                {/* Score by Case */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-semibold mb-4 text-gray-800">증례별 점수 상세</h3>
                    <div className="space-y-4">
                        {currentSession.selectedScenariosDetails.map((scenario, index) => (
                            <div key={scenario.scenarioId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-bold text-gray-800">증례 {index + 1}: {scenario.name}</p>
                                    <p className="text-sm text-gray-600">{scenario.primaryCategory} &gt; {scenario.secondaryCategory}</p>
                                </div>
                                <div className="text-xl font-bold text-blue-600">
                                    {scenario.score ?? 'N/A'} 점
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center mt-10">
                    <Link to="/mock-exam" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md">
                        모의고사 홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MockExamResultPage;
