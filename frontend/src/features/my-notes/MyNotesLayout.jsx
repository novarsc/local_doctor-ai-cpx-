import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, BookmarkIcon, DocumentTextIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const MyNotesLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { to: "/my-notes/bookmarks", text: "즐겨찾기", icon: <BookmarkIcon className="h-6 w-6" /> },
        { to: "/my-notes/incorrect", text: "오답노트", icon: <DocumentTextIcon className="h-6 w-6" /> },
        { to: "/my-notes/history", text: "학습 기록", icon: <ClockIcon className="h-6 w-6" /> },
        { to: "/my-notes/statistics", text: "학습 통계", icon: <ChartBarIcon className="h-6 w-6" /> },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className={`bg-white shadow-md flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="flex items-center justify-between p-4 h-16 border-b">
                    <h2 className={`text-2xl font-bold transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                        학습 노트
                    </h2>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                        className="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {isSidebarOpen ? <ChevronLeftIcon className="h-6 w-6" /> : <ChevronRightIcon className="h-6 w-6" />}
                    </button>
                </div>
                <nav className="mt-4">
                    {navItems.map(item => (
                        <NavLink 
                            key={item.to}
                            to={item.to} 
                            className={({ isActive }) => 
                                `flex items-center p-4 my-2 mx-2 rounded-md text-lg transition-colors ${
                                    isActive 
                                    ? 'bg-blue-100 text-blue-700 font-semibold' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            {item.icon}
                            <span className={`ml-4 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>{item.text}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <main className="flex-grow p-8 transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
};

export default MyNotesLayout;
