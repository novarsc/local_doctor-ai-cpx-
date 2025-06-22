/**
 * @file PrePracticePage.jsx
 * @description Page shown before starting a practice session. Displays scenario info.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// [수정] import 경로 및 함수 변경
import { fetchScenarioById } from '../../../store/slices/caseSlice';
import { startNewPracticeSession } from '../../../store/slices/practiceSessionSlice';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const PrePracticePage = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // [수정] state.cases 에서 데이터를 가져옴
  const { currentScenario, isLoading, error } = useSelector((state) => state.cases);

  // [수정] practiceSession의 상태는 '세션 시작' 버튼의 로딩 상태 표시용으로만 사용
  const { isLoading: isStartingSession } = useSelector((state) => state.practiceSession);

  const [selectedPersonality, setSelectedPersonality] = useState('');

  useEffect(() => {
    if (scenarioId) {
      // [수정] caseSlice의 action을 디스패치
      dispatch(fetchScenarioById(scenarioId));
    }
  }, [dispatch, scenarioId]);

  useEffect(() => {
    if (currentScenario && currentScenario.defaultAiPersonalityId) {
      setSelectedPersonality(currentScenario.defaultAiPersonalityId);
    }
  }, [currentScenario]);

  const handleStartPractice = () => {
    const sessionConfig = {
      scenarioId,
      selectedAiPersonalityId: selectedPersonality,
      practiceMode: 'chat',
    };
    dispatch(startNewPracticeSession(sessionConfig))
      .unwrap()
      .then((newSession) => { // action.payload가 newSession 객체입니다.
        // 세션이 성공적으로 생성되면 올바른 URL로 이동합니다.
        navigate(`/cases/practice/during/${newSession.practiceSessionId}`);
      })
      .catch((err) => {
        console.error("Failed to start practice session:", err);
        alert(`실습 세션을 시작하는 데 실패했습니다: ${err.message || '알 수 없는 오류'}`);
      });
  };

  // [수정] 로딩 조건 변경
  if (isLoading || !currentScenario) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner text="증례 정보를 불러오는 중..." /></div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">오류가 발생했습니다: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* 페이지 헤더 */}
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold text-indigo-600 mb-2">
            {currentScenario.primaryCategory} &gt; {currentScenario.secondaryCategory}
          </p>
          <h1 className="text-3xl font-bold text-gray-800">
            {currentScenario.name}
          </h1>
          <p className="mt-2 text-md text-gray-500">실습을 시작하기 전, 아래 내용을 확인하세요.</p>
        </header>

        {/* 상황 지침 박스 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-700">상황 지침</h2>
          </div>
          
          <div className="p-6 space-y-8">
            {/* 환자 정보 */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3">[환자 정보]</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong className="font-medium w-24 inline-block">나이/성별:</strong> {currentScenario.age}세 / {currentScenario.sex === 'male' ? '남자' : '여성'}</li>
                <li><strong className="font-medium w-24 inline-block">주요 호소:</strong> {currentScenario.presentingComplaint}</li>
              </ul>
            </div>
            
            {/* 활력 징후 */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3">[활력 징후]</h3>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-medium w-20 inline-block">혈압:</span> {currentScenario.bloodPressure} mmHg</li>
                <li><span className="font-medium w-20 inline-block">맥박:</span> {currentScenario.pulse} 회/분</li>
                <li><span className="font-medium w-20 inline-block">호흡:</span> {currentScenario.respiration} 회/분</li>
                <li><span className="font-medium w-20 inline-block">체온:</span> {currentScenario.temperature} °C</li>
              </ul>
            </div>

            {/* 응시자 지침 */}
            {currentScenario.description && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3">[응시자는 이 환자에게]</h3>
                <p className="text-gray-700 leading-relaxed">
                  {currentScenario.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI 환자 성격 선택 */}
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">AI 환자 성격 선택</h2>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setSelectedPersonality('p1-uuid-default')}
                className={`px-5 py-2 rounded-lg transition-all duration-200 ${selectedPersonality === 'p1-uuid-default' ? 'bg-primary text-white shadow-md scale-105' : 'bg-gray-200 hover:bg-gray-300'}`}>
                기본
              </button>
              <button 
                onClick={() => setSelectedPersonality('p2-uuid-cooperative')}
                className={`px-5 py-2 rounded-lg transition-all duration-200 ${selectedPersonality === 'p2-uuid-cooperative' ? 'bg-primary text-white shadow-md scale-105' : 'bg-gray-200 hover:bg-gray-300'}`}>
                협조적
              </button>
              <button 
                onClick={() => setSelectedPersonality('p3-uuid-uncooperative')}
                className={`px-5 py-2 rounded-lg transition-all duration-200 ${selectedPersonality === 'p3-uuid-uncooperative' ? 'bg-primary text-white shadow-md scale-105' : 'bg-gray-200 hover:bg-gray-300'}`}>
                비협조적
              </button>
            </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-4">
            <div className="text-sm text-gray-600">
              <p>이번 달 남은 오디오 실습 횟수: <span className="font-bold text-green-600">48회</span></p>
            </div>
            <Button
                onClick={handleStartPractice}
                disabled={isStartingSession}
                className="w-full sm:w-auto text-lg px-10 py-3"
                variant="primary"
            >
                {isStartingSession ? "세션 준비 중..." : "채팅으로 실습 시작"}
            </Button>
        </div>
      </div>
    </div>
  );
};
export default PrePracticePage;