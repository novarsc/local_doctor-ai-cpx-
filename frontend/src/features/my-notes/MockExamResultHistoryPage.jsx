/**
 * @file MockExamResultHistoryPage.jsx
 * @description Page to display mock exam results from the learning notes context.
 */

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMockExamSession } from '../../store/slices/mockExamSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MockExamResultHistoryPage = () => {
    const dispatch = useDispatch();
    const { mockExamSessionId } = useParams();
    const { currentSession, status, error } = useSelector(state => state.mockExam);

    // 모의고사 세션 정보 로드
    useEffect(() => {
        if (status !== 'loading') {
            dispatch(fetchMockExamSession(mockExamSessionId))
                .unwrap()
                .then((result) => {
                    console.log('Mock exam session fetched successfully:', result);
                })
                .catch((error) => {
                    console.error('Failed to fetch mock exam session:', error);
                });
        }
    }, [dispatch, mockExamSessionId]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner size="xl" />
                <h2 className="mt-6 text-2xl font-bold text-gray-800">결과를 불러오는 중입니다...</h2>
                <p className="mt-2 text-gray-600">모의고사 결과를 확인하고 있습니다.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <h2 className="text-red-800 font-semibold text-xl mb-2">오류 발생</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Link to="/my-notes/history" className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            학습 기록으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentSession) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <h2 className="text-yellow-800 font-semibold text-xl mb-2">세션을 찾을 수 없습니다</h2>
                        <p className="text-yellow-600 mb-4">요청하신 모의고사 세션을 찾을 수 없습니다.</p>
                        <Link to="/my-notes/history" className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                            학습 기록으로 돌아가기
                        </Link>
                    </div>
                </div>
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

                {/* Individual Case Results */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">개별 증례 결과</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentSession.selectedScenariosDetails?.map((caseDetail, index) => (
                            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900">증례 {index + 1}</h3>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        caseDetail.score >= 80 ? 'bg-green-100 text-green-800' :
                                        caseDetail.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {caseDetail.score ?? 'N/A'}점
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><strong>환자:</strong> {caseDetail.age}세 {caseDetail.sex}</p>
                                    <p><strong>주증:</strong> {caseDetail.presentingComplaint}</p>
                                    <p><strong>분류:</strong> {caseDetail.primaryCategory} - {caseDetail.secondaryCategory}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link to="/my-notes/history" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        학습 기록으로 돌아가기
                    </Link>
                    <Link to="/my-notes" className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        학습 노트 홈으로
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MockExamResultHistoryPage; 