// 생성할 파일: frontend/src/features/dashboard/components/SecondaryInfo.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { MaterialIcon } from './MaterialIcon';
import ProgressBar from '../../../components/common/ProgressBar';

// '빠른 실행' 내부 컴포넌트
const QuickActions = () => (
  <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
    <h3 className="text-xl font-semibold text-slate-700 mb-4">빠른 실행 ⚡</h3>
    <div className="space-y-3">
              <Link to="/mock-exams" className="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors">
        <MaterialIcon iconName="quiz" className="text-base" /> 모의고사 시작
      </Link>
      <Link to="/cases" className="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors">
        <MaterialIcon iconName="add_circle_outline" className="text-base" /> 새 시뮬레이션 시작
      </Link>
              <Link to="/my-notes" className="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors">
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
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-semibold text-slate-700 mb-3">최근 학습 이력 📚</h3>
      <p className="text-slate-600 text-sm font-medium">{activity.caseTitle}</p>
      <p className="text-xs text-slate-500 mt-1">수행일자: {activity.date}</p>
    </div>
  );
};


const SecondaryInfo = ({ weeklyGoal, lastActivity }) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <QuickActions />
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeeklyGoal goal={weeklyGoal} />
        <LastActivity activity={lastActivity} />
      </div>
    </section>
  );
};

export default SecondaryInfo;