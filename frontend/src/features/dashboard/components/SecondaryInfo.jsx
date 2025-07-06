// 생성할 파일: frontend/src/features/dashboard/components/SecondaryInfo.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { MaterialIcon } from './MaterialIcon';
import ProgressBar from '../../../components/common/ProgressBar';
import LearningPerformance from './LearningPerformance';

// '빠른 실행' 내부 컴포넌트
const QuickActions = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
    <h3 className="text-xl font-semibold text-slate-700 mb-4">빠른 실행 ⚡</h3>
    <div className="flex-1 flex flex-col justify-center space-y-3">
              <Link to="/mock-exams" className="w-full flex items-center justify-center gap-2 rounded-lg h-14 px-4 bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors">
        <MaterialIcon iconName="quiz" className="text-base" /> 모의고사 시작
      </Link>
      <Link to="/cases" className="w-full flex items-center justify-center gap-2 rounded-lg h-14 px-4 bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors">
        <MaterialIcon iconName="add_circle_outline" className="text-base" /> 새 시뮬레이션 시작
      </Link>
              <Link to="/my-notes" className="w-full flex items-center justify-center gap-2 rounded-lg h-14 px-4 bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors">
        <MaterialIcon iconName="bookmarks" className="text-base" /> 북마크한 사례 보기
      </Link>
    </div>
  </div>
);

// '나의 목표' 내부 컴포넌트
const WeeklyGoal = ({ goal }) => {
  if (!goal) return null;
  const progress = goal.target > 0 ? Math.round((goal.achieved / goal.target) * 100) : 0;
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-semibold text-slate-700 mb-3">나의 목표 🎯</h3>
      <p className="text-slate-600 text-sm mb-1">{goal.description}</p>
      <ProgressBar progress={progress} />
      <p className="text-xs text-slate-500 mt-1">{goal.achieved} / {goal.target} 건 달성</p>
    </div>
  );
};

// '최근 학습 이력' 내부 컴포넌트
const LastActivity = ({ activity }) => {
  if (!activity) return null;
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
      <h3 className="text-xl font-semibold text-slate-700 mb-4">최근 학습 이력 📚</h3>
      
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div>
          <p className="text-2xl font-bold text-slate-800 mb-3 leading-tight">{activity.caseTitle}</p>
          <p className="text-base text-slate-500">수행일자: {activity.date}</p>
        </div>
      </div>
      
      <div className="mt-4">
        <Link 
          to={`/cases/${activity.scenarioId}/practice`} 
          className="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          <MaterialIcon iconName="replay" className="text-base" /> 
          다시 시작
        </Link>
      </div>
    </div>
  );
};


const SecondaryInfo = ({ weeklyGoal, lastActivity, learningPerformance }) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <QuickActions />
      <LastActivity activity={lastActivity} />
      <LearningPerformance performance={learningPerformance} />
    </section>
  );
};

export default SecondaryInfo;