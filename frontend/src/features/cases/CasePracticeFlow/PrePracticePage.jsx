/**
 * @file PrePracticePage.jsx
 * @description Page shown before starting a practice session. Displays scenario info.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchScenarioForPractice, startNewPracticeSession } from '../../../store/slices/practiceSessionSlice';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const PrePracticePage = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 'practiceSession' 슬라이스에서 상태를 가져옵니다.
  const { currentScenario, isLoading, error } = useSelector((state) => state.practiceSession);
  const [selectedPersonality, setSelectedPersonality] = useState('');

  // 컴포넌트 마운트 시, scenarioId를 이용해 증례 상세 정보를 불러옵니다.
  useEffect(() => {
    if (scenarioId) {
      dispatch(fetchScenarioForPractice(scenarioId));
    }
  }, [dispatch, scenarioId]);
  
  // currentScenario 데이터가 로드되면 기본 AI 성격을 상태에 설정합니다.
  useEffect(() => {
    if (currentScenario && currentScenario.defaultAiPersonalityId) {
      setSelectedPersonality(currentScenario.defaultAiPersonalityId);
    }
  }, [currentScenario]);

  const handleStartPractice = () => {
    const sessionConfig = {
      scenarioId,
      selectedAiPersonalityId: selectedPersonality,
      practiceMode: 'chat', // 현재는 'chat' 모드로 고정
    };
    dispatch(startNewPracticeSession(sessionConfig))
      .unwrap()
      .then((newSession) => { // action.payload가 newSession 객체입니다.
        // 세션이 성공적으로 생성되면 올바른 URL로 이동합니다.
        navigate(`/cases/${scenarioId}/practice/during/${newSession.practiceSessionId}`);
      })
      .catch((err) => {
        console.error("Failed to start practice session:", err);
        alert(`실습 세션을 시작하는 데 실패했습니다: ${err.message}`);
      });
  };

  if (isLoading || !currentScenario) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner text="증례 정보를 불러오는 중..." /></div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">오류가 발생했습니다: {error}</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <header className="border-b pb-6 mb-8">
          {/* 변경점: 대분류, 중분류 표시 */}
          <p className="text-sm font-semibold text-primary mb-1">
            {currentScenario.primaryCategory} &gt; {currentScenario.secondaryCategory}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{currentScenario.name}</h1>
          <p className="mt-2 text-gray-500">실습을 시작하기 전, 환자 정보를 확인하세요.</p>
        </header>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">환자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base">
              {/* 변경점: 중첩 객체 없이 직접 데이터에 접근 */}
              <p><strong className="font-medium text-gray-500 w-24 inline-block">나이/성별</strong> {currentScenario.age}세 / {currentScenario.sex}</p>
              <p><strong className="font-medium text-gray-500 w-24 inline-block">주요 호소</strong> {currentScenario.presentingComplaint}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">활력 징후</h2>
            <div className="flex flex-wrap gap-3">
              {/* 변경점: 중첩 객체 없이 직접 데이터에 접근 */}
              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-4 py-2 rounded-full">혈압(BP): {currentScenario.bloodPressure}</span>
              <span className="text-sm font-medium bg-green-100 text-green-800 px-4 py-2 rounded-full">심박수(HR): {currentScenario.pulse}</span>
              <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">호흡수(RR): {currentScenario.respiration}</span>
              <span className="text-sm font-medium bg-red-100 text-red-800 px-4 py-2 rounded-full">체온(BT): {currentScenario.temperature}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">AI 환자 성격 선택</h2>
            <div className="flex space-x-3">
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
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-end items-center gap-4">
            <div className="text-sm text-gray-600">
              <p>이번 달 남은 오디오 실습 횟수: <span className="font-bold text-green-600">48회</span></p>
            </div>
            <Button
                onClick={handleStartPractice}
                disabled={isLoading}
                className="w-full sm:w-auto text-lg px-10 py-3"
                variant="primary"
            >
                {isLoading ? "세션 준비 중..." : "채팅으로 실습 시작"}
            </Button>
        </div>
      </div>
    </div>
  );
};
export default PrePracticePage;
