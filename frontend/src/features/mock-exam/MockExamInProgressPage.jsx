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

    useEffect(() => {
        if (!currentSession || currentSession.mockExamSessionId !== mockExamSessionId) {
            dispatch(fetchMockExamSession(mockExamSessionId));
        }
    }, [dispatch, mockExamSessionId, currentSession]);

    useEffect(() => {
        if (currentSession?.selectedScenariosDetails) {
            const caseDetails = currentSession.selectedScenariosDetails[caseIndex];
            if (caseDetails) setCurrentCase(caseDetails);
            else navigate('/mock-exam');
        }
    }, [currentSession, caseIndex, navigate]);

    const handleNextStep = () => {
        const nextCaseNumber = parseInt(caseNumber, 10) + 1;
        // This is a placeholder for finishing one case.
        // In a real scenario, this would be triggered after a case's timer runs out or is manually completed.

        if (nextCaseNumber > 6) {
            // End of exam, complete the session and navigate to results page
            dispatch(completeMockExam(mockExamSessionId))
                .unwrap()
                .then(() => {
                    navigate(`/mock-exam/${mockExamSessionId}/result`);
                });
        } else {
            navigate(`/mock-exam/${mockExamSessionId}/case/${nextCaseNumber}`);
        }
    };

    if (status === 'loading' || !currentCase) {
        return <div className="p-8 text-center">모의고사 정보를 불러오는 중입니다...</div>;
    }
    
    if (status === 'error') {
        return <div className="p-8 text-center text-red-500">오류가 발생했습니다: {error}</div>;
    }

    return (
        <div className="flex flex-col h-screen">
            <header className="p-4 bg-gray-800 text-white flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold">모의고사 진행 중</h1>
                <div className="text-lg font-semibold">증례 {caseNumber} / 6</div>
            </header>

            <div className="flex-grow p-6">
                <h2 className="text-2xl font-bold mb-4">{currentCase.name}</h2>
                <p className="mb-4">분류: {currentCase.primaryCategory} &gt; {currentCase.secondaryCategory}</p>
                <div className="bg-yellow-100 p-4 rounded-lg text-yellow-800">
                    <p><strong>[알림]</strong> 이 영역에 실제 증례를 실습할 수 있는 채팅 인터페이스가 통합될 예정입니다.</p>
                </div>
                 <div className="mt-8">
                    <button onClick={handleNextStep} disabled={status === 'loading'} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">
                         {status === 'loading' ? '처리 중...' : (caseNumber < 6 ? '다음 증례로 이동' : '최종 결과 보기')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MockExamInProgressPage;
