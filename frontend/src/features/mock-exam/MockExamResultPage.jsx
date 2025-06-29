/**
 * @file MockExamResultPage.jsx
 * @description Page to display the final results of a mock exam session.
 */

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCurrentMockExam, fetchMockExamSession } from '../../store/slices/mockExamSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MockExamResultPage = () => {
    const dispatch = useDispatch();
    const { mockExamSessionId } = useParams();
    const { currentSession, status, error } = useSelector(state => state.mockExam);

    // 디버깅을 위한 로그
    console.log('MockExamResultPage render:', { mockExamSessionId, currentSession, status, error });

    // 모의고사 세션 정보 로드
    useEffect(() => {
        console.log('MockExamResultPage useEffect triggered:', { mockExamSessionId, currentSession, status });
        
        // 결과 페이지에서는 항상 최신 세션 정보를 가져오도록 함
        // 모의고사 완료 후 최신 점수 정보를 보여주기 위함
        if (status !== 'loading') {
            console.log('Fetching mock exam session:', mockExamSessionId);
            dispatch(fetchMockExamSession(mockExamSessionId));
        }
        
        // 사용자가 이 결과 페이지를 떠날 때, Redux의 현재 모의고사 상태를 초기화합니다.
        return () => {
            dispatch(clearCurrentMockExam());
        }
    }, [dispatch, mockExamSessionId]); // currentSession을 의존성 배열에서 제거


    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner size="xl" />
                <h2 className="mt-6 text-2xl font-bold text-gray-800">결과를 불러오는 중입니다...</h2>
                <p className="mt-2 text-gray-600">모의고사 결과를 확인하고 있습니다.</p>
            </div>
        );
    }

    if (error || !currentSession) {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold mb-4">오류</h1>
                <p>결과를 표시하는 중 오류가 발생했습니다: {error || '세션 정보를 찾을 수 없습니다.'}</p>
                <p className="mt-2 text-sm text-gray-600">세션 ID: {mockExamSessionId}</p>
                <Link to="/mock-exams" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg">모의고사 홈으로 돌아가기</Link>
            </div>
        );
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
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-4">증례별 점수 상세</h3>
                    <div className="space-y-4">
                        {currentSession.selectedScenariosDetails.map((scenario, index) => (
                            <div key={scenario.scenarioId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                <div>
                                    <p className="font-bold text-gray-800">증례 {index + 1}: {scenario.name}</p>
                                    <p className="text-sm text-gray-600">{scenario.primaryCategory} &gt; {scenario.secondaryCategory}</p>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {scenario.score ?? 'N/A'} 점
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center mt-12">
                    <Link to="/mock-exams" className="px-10 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition shadow-md">
                        모의고사 홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MockExamResultPage;