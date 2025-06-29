// 생성할 파일: frontend/src/features/dashboard/components/Recommendations.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Recommendations = ({ cases }) => {
  if (!cases || cases.length === 0) return null;

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold text-slate-800">다음 목표: 추천 사례 🎯</h3>
        <Link to="/cases" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
          모든 사례 보기
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map(recCase => (
          <Link to={`/cases/practice/${recCase.id}`} key={recCase.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg transition-shadow cursor-pointer group">
            {/* 썸네일 이미지 부분을 완전히 제거 */}
            <div>
              <p className="text-lg font-semibold text-slate-800 group-hover:text-primary transition-colors mb-1">{recCase.title}</p>
              <p className="text-slate-600 text-sm mb-2">{recCase.desc}</p>
              {recCase.reason && (
                <div className="mt-2 p-2 bg-sky-50 border border-sky-200 rounded-md">
                  <p className="text-xs text-sky-700"><span className="font-semibold">추천 이유:</span> {recCase.reason}</p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Recommendations;