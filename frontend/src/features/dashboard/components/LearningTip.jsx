// 생성할 파일: frontend/src/features/dashboard/components/LearningTip.jsx

import React from 'react';
import { MaterialIcon } from './MaterialIcon';

const LearningTip = ({ tip }) => {
  if (!tip) return null;
  
  return (
    <section className="bg-gradient-to-r from-sky-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
      <div className="flex items-center gap-3">
        <MaterialIcon iconName="lightbulb" className="text-3xl text-white" />
        <h3 className="text-xl font-semibold">오늘의 학습 팁!</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{tip}</p>
    </section>
  );
};

export default LearningTip;