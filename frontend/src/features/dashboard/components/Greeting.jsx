import React from 'react';

const Greeting = ({ user, insights }) => {
  return (
    <section className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
        다시 오신 것을 환영합니다, {user.name} 선생님!
      </h2>
      <p className="text-slate-600 text-lg mb-4">
        오늘의 학습 목표를 확인하고 도전을 시작하세요! 💪
      </p>
      {/* 현재 `insights`는 백엔드에서 구현되지 않았습니다.
        추후 백엔드에서 `insights` 데이터를 보내주면 아래 UI가 자동으로 나타납니다.
      */}
      {insights && (
        <div className="space-y-3 text-sm text-slate-700 bg-sky-50 p-4 rounded-lg border border-sky-200">
          <p><span className="font-semibold text-sky-700">📊 학습 동향:</span> {insights.learningTimeTrend}</p>
          <p><span className="font-semibold text-sky-700">💡 주요 학습 분야:</span> {insights.mostPracticedSystem}</p>
          <p><span className="font-semibold text-amber-700">🎯 개선 포인트:</span> {insights.improvementSummary}</p>
        </div>
      )}
    </section>
  );
};

export default Greeting;