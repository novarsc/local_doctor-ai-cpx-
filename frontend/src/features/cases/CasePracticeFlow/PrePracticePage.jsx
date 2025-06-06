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

  const { currentScenario, isLoading, error } = useSelector((state) => state.practiceSession);
  const [selectedPersonality, setSelectedPersonality] = useState('');

  useEffect(() => {
    dispatch(fetchScenarioForPractice(scenarioId));
    
    return () => {
      // Clean up scenario details when leaving the page if a session hasn't started
      // The session state itself will be cleared in DuringPracticePage
    }
  }, [dispatch, scenarioId]);
  
  useEffect(() => {
    if (currentScenario) {
        setSelectedPersonality(currentScenario.defaultAiPersonalityId);
    }
  }, [currentScenario]);

  const handleStartPractice = () => {
    const sessionConfig = {
      scenarioId,
      selectedAiPersonalityId: selectedPersonality,
      practiceMode: 'chat', // Hardcoded for now
    };
    dispatch(startNewPracticeSession(sessionConfig)).then((action) => {
        // Navigate only if the session was created successfully
        if (action.type.endsWith('/fulfilled')) {
            navigate(`/cases/${scenarioId}/practice/during`);
        }
    });
  };

  if (isLoading && !currentScenario) return <div className="p-8 text-center">증례 정보를 불러오는 중입니다...</div>;
  if (error) return <div className="p-8 text-center text-red-500">오류가 발생했습니다: {error}</div>;
  if (!currentScenario) return null;
  
  const { name, patientInfo } = currentScenario;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 border-b pb-4 mb-6">{name}</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">환자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <p><strong>나이/성별:</strong> {patientInfo.age}세 / {patientInfo.sex === 'male' ? '남성' : '여성'}</p>
                <p><strong>주요 호소:</strong> {patientInfo.presentIllness}</p>
                <p><strong>과거력:</strong> {patientInfo.pastHistory}</p>
                <p><strong>사회력:</strong> {patientInfo.socialHistory}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">활력 징후</h2>
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">BP: {patientInfo.vitalSigns.bloodPressure}</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">HR: {patientInfo.vitalSigns.heartRate}</span>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">RR: {patientInfo.vitalSigns.respiratoryRate}</span>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">BT: {patientInfo.vitalSigns.bodyTemperature}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">AI 환자 성격 선택</h2>
            <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedPersonality('p1-uuid-default')}
                  className={`px-4 py-2 rounded-lg ${selectedPersonality === 'p1-uuid-default' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  기본
                </button>
                 <button 
                  onClick={() => setSelectedPersonality('p2-uuid-cooperative')}
                  className={`px-4 py-2 rounded-lg ${selectedPersonality === 'p2-uuid-cooperative' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  협조적
                </button>
                 <button 
                  onClick={() => setSelectedPersonality('p3-uuid-uncooperative')}
                  className={`px-4 py-2 rounded-lg ${selectedPersonality === 'p3-uuid-uncooperative' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  비협조적
                </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-end items-center gap-4">
            <div className="text-sm text-gray-600">
              <p>이번 달 남은 오디오 실습 횟수: <span className="font-bold text-green-600">48회</span></p>
            </div>
            <button
                onClick={handleStartPractice}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:bg-gray-400"
            >
                {isLoading ? "세션 준비 중..." : "채팅으로 실습 시작"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PrePracticePage;
