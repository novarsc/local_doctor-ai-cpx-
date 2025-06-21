import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const MyNotesLayout = () => (
    <div className="flex min-h-screen bg-gray-100">
        <aside className="w-64 bg-white p-6 shadow-md flex-shrink-0">
            <h2 className="text-2xl font-bold mb-6">MY 노트</h2>
            <nav className="space-y-2">
                <NavLink to="/my-notes/bookmarks" className={({ isActive }) => `block py-2 px-4 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>즐겨찾기</NavLink>
                <NavLink to="/my-notes/incorrect" className={({ isActive }) => `block py-2 px-4 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>오답노트</NavLink>
                <NavLink to="/my-notes/history" className={({ isActive }) => `block py-2 px-4 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>학습 기록</NavLink>
                <NavLink to="/my-notes/statistics" className={({ isActive }) => `block py-2 px-4 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>학습 통계</NavLink>
            </nav>
        </aside>
        <main className="flex-grow p-8">
            {/* 자식 라우트 컴포넌트가 이 자리에 렌더링됩니다. */}
            <Outlet />
        </main>
    </div>
);

export default MyNotesLayout;