// 파일 위치: frontend/src/features/my-notes/MyNotesLayout.jsx

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const MyNotesLayout = () => {
  const navLinkClass = ({ isActive }) =>
    `block w-full px-4 py-3 text-left rounded-lg transition-colors ${
      isActive ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="container mx-auto p-6 flex gap-8">
      {/* 1. 사이드 메뉴 */}
      <aside className="w-1/4 flex-shrink-0">
        <h1 className="text-3xl font-bold mb-6">MY 노트</h1>
        <nav className="space-y-2">
          <NavLink to="/my-notes/bookmarks" className={navLinkClass}>
            즐겨 찾는 증례
          </NavLink>
          <NavLink to="/my-notes/incorrect-answers" className={navLinkClass}>
            오답노트
          </NavLink>
          <NavLink to="/my-notes/history" className={navLinkClass}>
            나의 학습 활동
          </NavLink>
        </nav>
      </aside>

      {/* 2. 선택된 메뉴의 콘텐츠가 보여질 영역 */}
      <main className="w-3/4">
        <Outlet />
      </main>
    </div>
  );
};

export default MyNotesLayout;
