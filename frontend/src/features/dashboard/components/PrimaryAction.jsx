// 생성할 파일: frontend/src/features/dashboard/components/PrimaryAction.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';

const PrimaryAction = ({ ongoingCase }) => {
  if (ongoingCase) {
    // 진행 중인 사례가 있을 경우
    return (
      <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border-2 border-blue-500">
        <h3 className="text-2xl font-bold text-slate-800 mb-1">연습 계속하기 🚀</h3>
        <p className="text-slate-600 mb-6 text-base">중단한 부분부터 바로 시작하여 학습 흐름을 이어가세요.</p>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-lg bg-slate-50 p-6 border border-slate-200">
          <div className="flex-1">
            <p className="text-xl font-semibold text-slate-800 mb-1">{ongoingCase.title}</p>
            <p className="text-slate-600 text-sm mb-3">{ongoingCase.desc}</p>
          </div>
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <img src={ongoingCase.img} alt={ongoingCase.title} className="w-full h-auto object-cover rounded-lg shadow-md aspect-video" />
          </div>
        </div>
        <Link to={`/cases/${ongoingCase.id}/practice`}>
          <Button className="mt-6 w-full sm:w-auto">사례 계속하기</Button>
        </Link>
      </section>
    );
  }

  // 진행 중인 사례가 없을 경우
  return (
    <section className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center border-2 border-dashed border-sky-400">
      <h3 className="text-2xl font-bold text-slate-800 mb-2">새로운 도전 시작하기</h3>
      <p className="text-slate-600 mb-6">다양한 임상 사례를 통해 실력을 향상시켜 보세요.</p>
      <Link to="/mock-exam">
        <Button>새 모의고사 시작</Button>
      </Link>
    </section>
  );
};

export default PrimaryAction;