/**
 * @file MockExamMainPage.jsx
 * @description The main landing page for the mock exam feature.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { startNewMockExam } from '../../store/slices/mockExamSlice';
import { FaDice, FaListCheck } from 'react-icons/fa6';

const MockExamMainPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error } = useSelector(state => state.mockExam);

    const handleStartRandomExam = () => {
        // examType을 'random'으로 지정하여 새로운 모의고사를 시작합니다.
        dispatch(startNewMockExam({ examType: 'random' }))
            .unwrap()
            .then((session) => {
                // 세션이 성공적으로 생성되면, 해당 세션의 환자 정보 페이지로 이동합니다.
                if (session && session.mockExamSessionId) {
                    navigate(`/mock-exams/pre-practice/${session.mockExamSessionId}/1`);
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

    const handleStartSpecifiedExam = () => {
        navigate('/mock-exams/specified-setup');
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">모의고사 유형을 선택하세요</h1>
                <p className="text-lg text-gray-600">원하는 방식으로 모의고사를 시작할 수 있습니다.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* 랜덤 모의고사 카드 */}
                <div
                    className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-2xl cursor-pointer"
                    onClick={handleStartRandomExam}
                    tabIndex={0}
                    role="button"
                    aria-label="랜덤 모의고사 시작"
                >
                    <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-4">
                        <FaDice className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">랜덤 모의고사</h2>
                    <br />
                    <p className="text-xl leading-relaxed text-gray-600 mb-2 text-center">
                        6개의 증례가 무작위로 출제됩니다.<br />
                        <br />
                        <span className="text-blue-700 font-medium">실제 시험처럼 연습하고 싶을 때 추천!</span>
                    </p>
                    <br />
                    <ul className="text-base leading-relaxed text-gray-500 mb-4 text-center">
                        <li>• 주요 질환 계통에서 중복 없이 출제</li>
                        <li>• 문제 순서도 무작위</li>
                    </ul>
                    <button
                        onClick={e => { e.stopPropagation(); handleStartRandomExam(); }}
                        disabled={status === 'loading'}
                        className="w-full mt-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                        {status === 'loading' ? '세션 준비 중...' : '랜덤 모의고사 시작'}
                    </button>
                </div>
                {/* 지정 모의고사 카드 */}
                <div
                    className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-2xl cursor-pointer"
                    onClick={handleStartSpecifiedExam}
                    tabIndex={0}
                    role="button"
                    aria-label="지정 모의고사 시작"
                >
                    <div className="bg-green-100 text-green-600 rounded-full p-4 mb-4">
                        <FaListCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">지정 모의고사</h2>
                    <br />
                    <p className="text-xl leading-relaxed text-gray-600 mb-2 text-center">
                        직접 원하는 증례를 선택합니다.<br />
                        <br />                        
                        <span className="text-green-700 font-medium">취약 파트 집중 연습에 적합!</span>
                        
                    </p>
                    <br />
                    <ul className="text-base leading-relaxed text-gray-500 mb-4 text-center">
                        <li>• 중분류/질환명 단위로 자유롭게 선택</li>
                        <li>• 선택하지 않은 증례는 랜덤 출제</li>
                    </ul>
                    <button
                        onClick={e => { e.stopPropagation(); handleStartSpecifiedExam(); }}
                        disabled={status === 'loading'}
                        className="w-full mt-auto px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                        지정 모의고사 설정 및 시작
                    </button>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-8 text-center">오류: {error}</p>}
        </div>
    );
};

export default MockExamMainPage;