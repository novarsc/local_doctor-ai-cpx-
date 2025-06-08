/**
 * @file PrePracticePage.jsx
 * @description Page shown before starting a practice session. Displays scenario info.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchScenarioForPractice, startNewPracticeSession, clearPracticeSession } from '../../../store/slices/practiceSessionSlice';

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
    // 페이지를 떠날 때 이전 세션 정보를 정리할 수 있습니다.
    return () => {
      // dispatch(clearPracticeSession()); // 필요에 따라 주석 해제
    };
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
      .then(() => {
        // 세션이 성공적으로 생성되면 실습 페이지로 이동합니다.
        navigate(`/cases/${scenarioId}/practice/during`);
      })
      .catch((err) => {
        console.error("Failed to start practice session:", err);
        alert(`실습 세션을 시작하는 데 실패했습니다: ${err.message}`);
      });
  };

  if (isLoading && !currentScenario) {
    return <div className="p-8 text-center">증례 정보를 불러오는 중입니다...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">오류가 발생했습니다: {error}</div>;
  }
  if (!currentScenario) {
    // 데이터가 없는 경우 (백엔드 에러 등으로 인해)
    return <div className="p-8 text-center">증례 정보를 불러올 수 없습니다.</div>;
  }
  
  const { name, patientInfo } = currentScenario;

 return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* 1. 메인 컨텐츠 카드의 최대 너비를 지정하고 그림자 효과를 추가해 더 입체적으로 만듭니다. */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <header className="border-b pb-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
          <p className="mt-2 text-gray-500">실습을 시작하기 전, 환자 정보를 확인하세요.</p>
        </header>

        {/* 2. 각 정보 섹션을 div로 감싸고 제목(h2)과 여백을 추가하여 명확하게 분리합니다. */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">환자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base">
              <p><strong className="font-medium text-gray-500 w-24 inline-block">나이/성별</strong> {patientInfo.age}세 / {patientInfo.sex === 'male' ? '남성' : '여성'}</p>
              <p><strong className="font-medium text-gray-500 w-24 inline-block">주요 호소</strong> {patientInfo.presentIllness}</p>
              <p><strong className="font-medium text-gray-500 w-24 inline-block">과거력</strong> {patientInfo.pastHistory}</p>
              <p><strong className="font-medium text-gray-500 w-24 inline-block">사회력</strong> {patientInfo.socialHistory}</p>
            </div>
          </div>
          
          {patientInfo.vitalSigns && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">활력 징후</h2>
              <div className="flex flex-wrap gap-3">
                {/* 뱃지 스타일을 좀 더 눈에 띄게 개선합니다. */}
                <span className="text-sm font-medium bg-blue-100 text-blue-800 px-4 py-2 rounded-full">혈압(BP): {patientInfo.vitalSigns.bloodPressure}</span>
                <span className="text-sm font-medium bg-green-100 text-green-800 px-4 py-2 rounded-full">심박수(HR): {patientInfo.vitalSigns.heartRate}</span>
                <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">호흡수(RR): {patientInfo.vitalSigns.respiratoryRate}</span>
                <span className="text-sm font-medium bg-red-100 text-red-800 px-4 py-2 rounded-full">체온(BT): {patientInfo.vitalSigns.bodyTemperature}</span>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">AI 환자 성격 선택</h2>
            <div className="flex space-x-3">
               {/* 3. 선택된 버튼에 그림자 효과를 주어 입체감을 더합니다. */}
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

        {/* 4. 최종 액션 영역을 구분하고, 버튼을 더 강조합니다. */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-end items-center gap-4">
            <div className="text-sm text-gray-600">
              {/* UX 상세 명세 5.2.3.1. 에 따라 오디오 실습 횟수 안내 추가 */}
              <p>이번 달 남은 오디오 실습 횟수: <span className="font-bold text-green-600">48회</span></p>
            </div>
            <button
                onClick={handleStartPractice}
                disabled={isLoading}
                // 공통 버튼 스타일을 적용하고, 크기를 키워 최종 액션임을 강조합니다.
                className="btn btn-primary w-full sm:w-auto text-lg px-10 py-3"
            >
                {isLoading ? "세션 준비 중..." : "채팅으로 실습 시작"}
            </button>
        </div>
      </div>
    </div>
  );
};
export default PrePracticePage;