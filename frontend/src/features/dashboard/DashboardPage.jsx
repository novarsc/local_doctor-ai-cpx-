// frontend/src/features/dashboard/DashboardPage.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../../store/slices/dashboardSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// 새로 만든 컴포넌트들을 모두 import 합니다.
import Greeting from './components/Greeting';
import PrimaryAction from './components/PrimaryAction';
import StatsSummary from './components/StatsSummary';
import LearningCharts from './components/LearningCharts';
import Recommendations from './components/Recommendations';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { summary, isLoading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  if (!summary) {
    return <div className="text-center p-8">대시보드 데이터를 표시할 수 없습니다.</div>;
  }

  // 완성된 대시보드 레이아웃
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <Greeting user={summary.user} insights={summary.insights} />
      <PrimaryAction ongoingCase={summary.ongoingCase} />
      <StatsSummary stats={summary.stats} />
      <LearningCharts 
        scoreTrend={summary.scoreTrendData} 
        completionTrend={summary.monthlyCompletionData}
      />
      <Recommendations cases={summary.recommendedCases} />
      
      {/* TODO: 나의 목표, 빠른 실행, 학습 팁 등 나머지 컴포넌트 추가 */}
    </div>
  );
};

export default DashboardPage;