// frontend/src/features/dashboard/DashboardPage.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../../store/slices/dashboardSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// 모든 대시보드 컴포넌트 import
import Greeting from './components/Greeting';
import PrimaryAction from './components/PrimaryAction';
import SecondaryInfo from './components/SecondaryInfo';
import StatsSummary from './components/StatsSummary';
import LearningCharts from './components/LearningCharts';
import LearningTip from './components/LearningTip';
import Recommendations from './components/Recommendations';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { summary, isLoading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (isLoading || !summary) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  return (
    <main className="flex-1 px-6 md:px-10 lg:px-16 py-10 bg-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <Greeting user={summary.user} insights={summary.insights} />
        <StatsSummary stats={summary.stats} />
        <PrimaryAction ongoingCase={summary.ongoingCase} />
        <SecondaryInfo 
          weeklyGoal={summary.weeklyGoal} 
          lastActivity={summary.lastActivity} 
          learningPerformance={summary.learningPerformance}
        />
        <LearningCharts 
          scoreTrend={summary.scoreTrendData} 
          completionTrend={summary.monthlyCompletionData}
        />
        <LearningTip tip={summary.learningTip} />
        <Recommendations cases={summary.recommendedCases} />
      </div>
    </main>
  );
};

export default DashboardPage;