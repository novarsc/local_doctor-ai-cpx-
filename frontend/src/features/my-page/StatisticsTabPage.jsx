import React from 'react';
import ProgressBar from '../../components/common/ProgressBar';

// TODO: 이 데이터는 추후 백엔드 API를 통해 동적으로 받아와야 합니다.
const mockStatsData = {
  summary: {
    totalHours: 42,
    completedCases: 15,
    totalCases: 48,
    overallScore: 82,
    mockExamScore: 88,
  },
  scoreTrend: [
    { date: '5/1', score: 75 },
    { date: '5/8', score: 80 },
    { date: '5/15', score: 78 },
    { date: '5/22', score: 85 },
    { date: '5/29', score: 90 },
  ],
  performanceByCategory: [
    { category: '소화기', score: 92 },
    { category: '순환기', score: 85 },
    { category: '호흡기', score: 78 },
    { category: '신장/비뇨', score: 88 },
    { category: '정신/신경', score: 75 },
  ],
};

// 각 카드 UI를 위한 재사용 컴포넌트
const StatCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow flex items-center">
        <div className="bg-blue-100 text-primary p-3 rounded-full mr-4">
            {/* 아이콘 예시 (실제 아이콘 라이브러리 필요) */}
            <span className="material-icons">{icon}</span>
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const StatisticsTabPage = () => {
  return (
    <div className="space-y-8">
      {/* 요약 지표 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="총 학습 시간" value={`${mockStatsData.summary.totalHours}시간`} icon="schedule" />
        <StatCard title="완료 증례 수" value={`${mockStatsData.summary.completedCases} / ${mockStatsData.summary.totalCases}개`} icon="checklist" />
        <StatCard title="전체 평균 점수" value={`${mockStatsData.summary.overallScore}점`} icon="grade" />
        <StatCard title="모의고사 평균 점수" value={`${mockStatsData.summary.mockExamScore}점`} icon="assessment" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 학습 동향 그래프 섹션 */}
        <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">점수 추이</h3>
            <div className="h-64 bg-gray-100 flex items-center justify-center rounded-md">
                <p className="text-gray-500">[점수 추이 그래프가 여기에 표시됩니다]</p>
                {/* TODO: Chart.js 또는 Recharts 같은 라이브러리를 사용하여 그래프 구현 */}
            </div>
        </div>

        {/* 분류별 성취도 섹션 */}
        <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">분류별 성취도</h3>
            <div className="space-y-4">
                {mockStatsData.performanceByCategory.map(item => (
                    <div key={item.category}>
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-gray-700">{item.category}</span>
                            <span className="text-sm font-medium text-primary">{item.score}점</span>
                        </div>
                        {/* 2. 기존 div 구조를 ProgressBar 컴포넌트로 교체합니다. */}
                       <ProgressBar value={item.score} />
                        </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTabPage;