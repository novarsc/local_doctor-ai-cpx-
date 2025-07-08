/**
 * @file MockExamPrePracticePage.jsx
 * @description Page shown before starting a mock exam case. Displays case info.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMockExamSession } from '../../store/slices/mockExamSlice';
import { startPracticeSession, resumePracticeSession } from '../../store/slices/practiceSessionSlice';
import { mockExamService } from '../../services/mockExamService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MockExamPrePracticePage = () => {
  const { mockExamSessionId, caseNumber } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentSession, status, error } = useSelector((state) => state.mockExam);
  const { isLoading: isStartingSession } = useSelector((state) => state.practiceSession);

  const [currentCase, setCurrentCase] = useState(null);
  const [isStartingPractice, setIsStartingPractice] = useState(false);

  useEffect(() => {
    if (mockExamSessionId) {
      dispatch(fetchMockExamSession(mockExamSessionId));
    }
  }, [dispatch, mockExamSessionId]);

  useEffect(() => {
    if (currentSession?.selectedScenariosDetails) {
      const caseDetails = currentSession.selectedScenariosDetails[parseInt(caseNumber) - 1];
      if (caseDetails) {
        setCurrentCase(caseDetails);
      } else {
        navigate('/mock-exams');
      }
    }
  }, [currentSession, caseNumber, navigate]);

  const handleStartPractice = async () => {
    try {
      setIsStartingPractice(true);
      console.log('Starting practice session for case:', caseNumber);
      const result = await mockExamService.startCasePractice(mockExamSessionId, caseNumber);
      console.log('Practice session result:', result);
      
      if (result.isResumed) {
        // 기존 세션 이어하기
        console.log('Resuming existing session');
        dispatch(resumePracticeSession(result.practiceSessionId));
      } else {
        // 새 세션 시작
        console.log('Starting new session');
        dispatch(startPracticeSession({
          sessionId: result.practiceSessionId,
          scenarioId: result.scenarioId,
          scenarioName: result.scenarioName
        }));
      }
      
      // 채팅 페이지로 이동
      navigate(`/mock-exams/live/${mockExamSessionId}/${caseNumber}`);
    } catch (error) {
      console.error('Failed to start practice session:', error);
      alert('실습 세션 시작에 실패했습니다.');
    } finally {
      setIsStartingPractice(false);
    }
  };

  if (status === 'loading' || !currentCase) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner text="증례 정보를 불러오는 중..." /></div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-red-500">오류가 발생했습니다: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-3xl mx-auto flex flex-col flex-1">
        {/* 페이지 헤더 */}
        <header className="mb-6 text-center">
          <p className="text-sm font-semibold text-indigo-600 mb-2">
            모의고사 진행 중
          </p>
          <h1 className="text-3xl font-bold text-gray-800">
            증례 {caseNumber} / 6
          </h1>
        </header>

        {/* 모의고사 안내 - 상단에 단독 배치 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 w-full">
          <h2 className="text-xl font-semibold text-blue-800 mb-4 text-center">모의고사 안내</h2>
          <div className="space-y-3 text-blue-700">
            <p className="flex items-center">
              <span className="font-medium mr-2">⏱️</span>
              각 증례당 12분의 제한 시간이 있습니다.
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">📝</span>
              시간이 종료되면 자동으로 다음 증례로 넘어갑니다.
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">🎯</span>
              총 6개의 증례를 연속으로 실습합니다.
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">📊</span>
              모든 증례 완료 후 종합 평가 결과를 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 상황 지침 박스 - 가운데 넓게 배치 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full mx-auto mb-6">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-700">상황 지침</h2>
          </div>
          <div className="p-6 space-y-8">
            {/* 환자 정보 */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3">[환자 정보]</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong className="font-medium w-24 inline-block">나이/성별:</strong> {currentCase.age}세 / {currentCase.sex === 'male' ? '남자' : '여성'}</li>
                <li><strong className="font-medium w-24 inline-block">주요 호소:</strong> {currentCase.presentingComplaint}</li>
              </ul>
            </div>
            {/* 활력 징후 */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3">[활력 징후]</h3>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-medium w-20 inline-block">혈압:</span> {currentCase.bloodPressure} </li>
                <li><span className="font-medium w-20 inline-block">맥박:</span> {currentCase.pulse} </li>
                <li><span className="font-medium w-20 inline-block">호흡:</span> {currentCase.respiration} </li>
                <li><span className="font-medium w-20 inline-block">체온:</span> {currentCase.temperature} </li>
              </ul>
            </div>
            {/* 응시자 지침 */}
            {currentCase.description && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3">[응시자는 이 환자에게]</h3>
                <p className="text-gray-700 leading-relaxed">
                  {currentCase.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-2 pt-2 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0 bg-gray-50 z-10">
            <div className="flex flex-row w-full sm:w-auto">
                {currentSession?.examType === 'random' ? (
                    <Button
                        onClick={() => navigate('/mock-exams')}
                        variant="secondary"
                        className="w-full sm:w-auto"
                    >
                        모의고사 취소
                    </Button>
                ) : (
                    <Button
                        onClick={() => navigate('/mock-exams/specified-setup')}
                        variant="outline"
                        className="w-full sm:w-auto border-blue-500 text-blue-700 hover:bg-blue-50 hover:border-blue-600 focus:ring-2 focus:ring-blue-200 font-semibold rounded-lg px-6 py-2 flex items-center gap-2 transition-colors duration-150"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1 inline-block">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        이전 단계로 돌아가기
                    </Button>
                )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-sm text-gray-600">
                  <p>증례 {caseNumber} / 6</p>
                </div>
                <Button
                    onClick={handleStartPractice}
                    disabled={isStartingSession || isStartingPractice}
                    className="w-full sm:w-auto text-lg px-10 py-3"
                    variant="primary"
                >
                    {isStartingSession || isStartingPractice ? "세션 준비 중..." : "채팅으로 실습 시작"}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MockExamPrePracticePage; 