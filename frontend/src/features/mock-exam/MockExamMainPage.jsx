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
        // examType을 'random'으로 지정하여 새로운 모의고사를 시작합니다.
        dispatch(startNewMockExam({ examType: 'random' }))
            .unwrap()
            .then((session) => {
                // 세션이 성공적으로 생성되면, 해당 세션의 첫 번째 증례 페이지로 이동합니다.
                if (session && session.mockExamSessionId) {
                    navigate(`/mock-exams/live/${session.mockExamSessionId}/1`);
                } else {
                    // 비정상적인 응답에 대한 방어 코드
                    console.error("Mock exam session ID not found in response.");
                    alert("모의고사 세션을 생성했지만, 세션 ID를 받지 못했습니다. 다시 시도해 주세요.");
                }
            })
            .catch((err) => {
                console.error('Failed to start mock exam:', err);
                // 에러 메시지는 error 상태를 통해 자동으로 표시될 수 있습니다.
            });
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800">실전 모의고사</h1>
                <p className="text-lg text-gray-600 mt-2">실제 시험과 동일한 환경에서 6개의 증례를 연속으로 실습하며 실력을 점검해보세요.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Start New Exam Section */}
                <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">새 모의고사 시작하기</h2>
                    
                    <div className="border-t pt-6 flex-grow">
                        <h3 className="text-xl font-bold text-blue-600">랜덤 모의고사</h3>
                        <p className="text-base text-gray-600 my-3">
                            서로 다른 주요 질환 계통에서 6개의 증례가 무작위로 출제되어, 종합적인 대응 능력을 평가합니다.
                        </p>
                        <button
                            onClick={handleStartRandomExam}
                            disabled={status === 'loading'}
                            className="w-full mt-4 px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none"
                        >
                            {status === 'loading' ? '세션 준비 중...' : '랜덤 모의고사 시작'}
                        </button>
                    </div>

                    <div className="border-t pt-6 mt-8 flex-grow">
                        <h3 className="text-xl font-bold text-gray-400">지정 모의고사</h3>
                        <p className="text-base text-gray-500 my-3">
                            응시하고 싶은 특정 질환을 선택하여 모의고사를 구성합니다. (개발 예정)
                        </p>
                        <button
                            disabled={true}
                            className="w-full mt-4 px-6 py-4 bg-gray-300 text-gray-500 font-bold rounded-lg cursor-not-allowed"
                        >
                            지정 모의고사 설정
                        </button>
                    </div>
                     {error && <p className="text-red-500 text-sm mt-4">오류: {error}</p>}
                </div>

                {/* Exam History Section */}
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">나의 모의고사 기록</h2>
                    <div className="text-center text-gray-500 py-20 border-2 border-dashed rounded-lg flex flex-col justify-center items-center">
                        <p className="text-lg">아직 응시한 모의고사 기록이 없습니다.</p>
                        <p className="text-sm mt-2">(모의고사 히스토리 기능은 개발 예정입니다.)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockExamMainPage;