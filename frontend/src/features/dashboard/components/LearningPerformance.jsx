import React from 'react';

const LearningPerformance = ({ performance }) => {
  if (!performance) return null;
  
  const { thisWeek, thisMonth, improvement } = performance;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-semibold text-slate-700 mb-4">📈 학습 성과 요약</h3>
      
      {/* 이번 주 성과 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-600 mb-2">이번 주</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-600">{thisWeek.completedCases}</p>
            <p className="text-slate-500">완료 사례</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{thisWeek.averageScore}</p>
            <p className="text-slate-500">평균 점수</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{thisWeek.totalTime}</p>
            <p className="text-slate-500">학습 시간(분)</p>
          </div>
        </div>
      </div>
      
      {/* 이번 달 성과 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-600 mb-2">이번 달</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-600">{thisMonth.completedCases}</p>
            <p className="text-slate-500">완료 사례</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{thisMonth.averageScore}</p>
            <p className="text-slate-500">평균 점수</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{thisMonth.totalTime}</p>
            <p className="text-slate-500">학습 시간(분)</p>
          </div>
        </div>
      </div>
      
      {/* 개선도 */}
      {improvement.scoreChange !== 0 && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-slate-600 mb-2">지난 달 대비</h4>
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-medium ${improvement.scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvement.scoreChange > 0 ? '+' : ''}{improvement.scoreChange}점
            </span>
            <span className="text-slate-500">평균 점수</span>
            <span className="mx-2">•</span>
            <span className={`font-medium ${improvement.caseChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvement.caseChange > 0 ? '+' : ''}{improvement.caseChange}건
            </span>
            <span className="text-slate-500">완료 사례</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPerformance; 