import React from 'react';
import { MaterialIcon } from './MaterialIcon'; // 아이콘을 위한 재사용 컴포넌트(아래에서 생성)

const StatsSummary = ({ stats }) => {
  if (!stats || stats.length === 0) return null;

  return (
    <section>
      <h3 className="text-2xl font-semibold text-slate-800 mb-4">핵심 통계 요약 📊</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 text-slate-700">
              <MaterialIcon iconName={stat.icon} />
              <p className="text-base font-medium">{stat.label}</p>
            </div>
            <p className="text-slate-900 text-4xl font-bold">
              {stat.value}
              {stat.unit && <span className="text-2xl font-semibold text-slate-500 ml-1">{stat.unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSummary;