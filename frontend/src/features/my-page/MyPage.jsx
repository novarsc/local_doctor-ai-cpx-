import React, { useState } from 'react';
import StatisticsTabPage from './StatisticsTabPage'; // 1. 추가
import AccountManagementTabPage from './AccountManagementTabPage'; // 1. 추가

// 2. 기존 플레이스홀더 컴포넌트들은 삭제합니다.
// const LearningStatsContent = () => { ... };
// const AccountManagementContent = () => { ... };

const MyPage = () => {
    const [activeTab, setActiveTab] = useState('stats'); // 'stats' 또는 'account'

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800">마이 페이지</h1>
                <p className="text-lg text-gray-600 mt-2">나의 학습 현황을 확인하고 계정 정보를 관리하세요.</p>
            </header>

            <div className="mb-8 border-b border-gray-200">
                <nav className="flex space-x-6">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`py-4 px-1 text-lg font-medium transition-colors ${activeTab === 'stats' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    >
                        학습 통계
                    </button>
                    <button 
                        onClick={() => setActiveTab('account')}
                        className={`py-4 px-1 text-lg font-medium transition-colors ${activeTab === 'account' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    >
                        계정 관리
                    </button>
                </nav>
            </div>

            <div>
                {/* 3. 실제 컴포넌트로 교체 */}
                {activeTab === 'stats' && <StatisticsTabPage />}
                {activeTab === 'account' && <AccountManagementTabPage />}
            </div>
        </div>
    );
};

export default MyPage;