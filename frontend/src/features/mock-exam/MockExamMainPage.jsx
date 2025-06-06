/**
 * @file MockExamMainPage.jsx
 * @description The main landing page for the mock exam feature.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { startNewMockExam } from '../../store/slices/mockExamSlice';

const MockExamMainPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error } = useSelector(state => state.mockExam);

    const handleStartRandomExam = () => {
        dispatch(startNewMockExam({ examType: 'random' }))
            .unwrap()
            .then((session) => {
                // Navigate to the first case of the mock exam upon successful session creation
                if (session && session.mockExamSessionId) {
                    navigate(`/mock-exam/${session.mockExamSessionId}/case/1`);
                } else {
                    // Handle case where session is not created properly
                    console.error("Mock exam session ID not found in response.");
                }
            })
            .catch((err) => {
                console.error('Failed to start mock exam:', err);
            });
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-2">실전 모의고사</h1>
            <p className="text-gray-600 mb-8">실제 시험과 동일한 환경에서 실력을 점검해보세요.</p>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Start New Exam Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">새 모의고사 시작하기</h2>
                    
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-bold">랜덤 모의고사</h3>
                        <p className="text-sm text-gray-600 my-2">서로 다른 주요 질환 계통에서 6개의 증례가 무작위로 출제됩니다.</p>
                        <button
                            onClick={handleStartRandomExam}
                            disabled={status === 'loading'}
                            className="w-full mt-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {status === 'loading' ? '시작 중...' : '랜덤 모의고사 시작'}
                        </button>
                    </div>

                    <div className="border-t pt-4 mt-6">
                        <h3 className="text-lg font-bold">지정 모의고사</h3>
                        <p className="text-sm text-gray-600 my-2">응시하고 싶은 특정 질환을 선택하여 모의고사를 구성합니다. (개발 예정)</p>
                        <button
                            disabled={true}
                            className="w-full mt-2 px-6 py-3 bg-gray-300 text-gray-500 font-bold rounded-md cursor-not-allowed"
                        >
                            지정 모의고사 설정
                        </button>
                    </div>
                     {error && <p className="text-red-500 text-sm mt-4">오류: {error}</p>}
                </div>

                {/* Exam History Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">나의 모의고사 기록</h2>
                    <div className="text-center text-gray-500 py-10 border rounded-lg">
                        <p>아직 응시한 모의고사 기록이 없습니다.</p>
                        <p className="text-sm mt-2">(모의고사 히스토리 기능은 개발 예정입니다.)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockExamMainPage;

