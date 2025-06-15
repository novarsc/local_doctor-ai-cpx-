// 생성할 파일: frontend/src/features/dashboard/components/LearningCharts.jsx

import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Chart.js에 필요한 모든 구성 요소를 등록합니다.
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    tooltip: {
      enabled: true,
      backgroundColor: '#0f172a',
      padding: 10,
      cornerRadius: 4,
    },
  },
  scales: {
    y: { beginAtZero: true },
    x: { grid: { display: false } },
  },
};

const LearningCharts = ({ scoreTrend, completionTrend }) => {
  const scoreChartData = {
    labels: scoreTrend?.map(d => d.month) || [],
    datasets: [{
      label: '평균 점수',
      data: scoreTrend?.map(d => d.score) || [],
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
    }],
  };

  const completionChartData = {
    labels: completionTrend?.map(d => d.month) || [],
    datasets: [{
      label: '완료 사례 수',
      data: completionTrend?.map(d => d.completed) || [],
      backgroundColor: '#38bdf8',
      borderRadius: 4,
    }],
  };

  return (
    <section>
      <h3 className="text-2xl font-semibold text-slate-800 mb-4">학습 동향 분석 📈</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h4 className="text-lg font-semibold text-slate-700 mb-4">월간 평균 점수 추이</h4>
          <div className="h-80">
            <Line data={scoreChartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h4 className="text-lg font-semibold text-slate-700 mb-4">월간 완료 사례 수</h4>
          <div className="h-80">
            <Bar data={completionChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningCharts;