/**
 * @file MockExamInProgressPage.jsx
 * @description Page for conducting a mock exam, progressing through cases.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMockExamSession, completeMockExam } from '../../store/slices/mockExamSlice';

const MockExamInProgressPage = () => {
    const { mockExamSessionId, caseNumber } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentSession, status, error } = useSelector(state => state.mockExam);
    const [currentCase, setCurrentCase] = useState(null);
    const caseIndex = parseInt(caseNumber, 10) - 1;

    // 세션 정보가 없거나(새로고침 등) 다른 세션일 경우 서버에서 다시 불러옵니다.
    useEffect(() => {
        if (!currentSession || currentSession.mockExamSessionId !== mockExamSessionId) {
            dispatch(fetchMockExamSession(mockExamSessionId));
        }
    }, [dispatch, mockExamSessionId, currentSession]);

    // 세션 정보가 로드되면 현재 caseNumber에 맞는 증례 정보를 설정합니다.
    useEffect(() => {
        if (currentSession?.selectedScenariosDetails) {
            const caseDetails = currentSession.selectedScenariosDetails[caseIndex];
            if (caseDetails) {
                setCurrentCase(caseDetails);
            } else {
                // 유효하지 않은 caseNumber일 경우 모의고사 메인으로 이동
                navigate('/mock-exam');
            }
        }
    }, [currentSession, caseIndex, navigate]);

    const handleNextStep = () => {
        const nextCaseNumber = parseInt(caseNumber, 10) + 1;
        
        // UX 상세 명세 5.3.3에 따라, 각 증례는 12분 타이머가 있거나 '진료 종료' 버튼으로 종료됩니다.
        // 여기서는 그 과정을 '다음 단계' 버튼으로 간소화하여 시뮬레이션합니다.
        // 실제 구현 시에는 각 증례 실습 컴포넌트가 종료된 후 이 로직이 호출됩니다.

        if (nextCaseNumber > 6) {
            // 마지막 증례이므로, 모의고사를 완료하고 결과 페이지로 이동합니다.
            dispatch(completeMockExam(mockExamSessionId))
                .unwrap()
                .then(() => {
                    navigate(`/mock-exam/${mockExamSessionId}/result`);
                })
                .catch((err) => {
                    alert(`모의고사 완료에 실패했습니다: ${err.message}`);
                });
        } else {
            // 다음 증례 페이지로 이동합니다.
            navigate(`/mock-exam/${mockExamSessionId}/case/${nextCaseNumber}`);
        }
    };

    if (status === 'loading' || !currentCase) {
        return <div className="flex items-center justify-center h-screen"><div className="text-xl">모의고사 정보를 불러오는 중입니다...</div></div>;
    }
    
    if (status === 'error') {
        return <div className="flex items-center justify-center h-screen text-red-500">오류가 발생했습니다: {error}</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="p-4 bg-white shadow-md flex justify-between items-center z-10">
                <h1 className="text-xl font-bold text-gray-800">모의고사 진행 중</h1>
                <div className="text-lg font-semibold bg-blue-100 text-blue-700 px-4 py-1 rounded-full">증례 {caseNumber} / 6</div>
            </header>

            <main className="flex-grow p-6 flex flex-col items-center justify-center text-center">
                <div className="bg-white p-10 rounded-lg shadow-xl w-full max-w-2xl">
                    <h2 className="text-3xl font-bold mb-2">{currentCase.name}</h2>
                    <p className="text-md text-gray-500 mb-6">{currentCase.primaryCategory} &gt; {currentCase.secondaryCategory}</p>
                    
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-8">
                        <p><strong>[안내]</strong> 이 영역에 실제 증례를 실습할 수 있는 채팅 인터페이스가 통합될 예정입니다.</p>
                        <p className="text-sm mt-1">현재 단계에서는 '다음' 버튼을 눌러 모의고사 흐름을 테스트합니다.</p>
                    </div>

                    <div className="mt-8">
                        <button 
                            onClick={handleNextStep} 
                            disabled={status === 'loading'} 
                            className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-transform transform hover:scale-105"
                        >
                            {status === 'loading' ? '처리 중...' : (parseInt(caseNumber, 10) < 6 ? '다음 증례로 이동' : '최종 결과 보기')}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MockExamInProgressPage;