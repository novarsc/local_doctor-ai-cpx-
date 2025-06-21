import React, { useState } from 'react';
import AccountManagementTabPage from './AccountManagementTabPage';

// '결제 관리' 탭에 표시될 임시 컴포넌트
const PaymentManagementPlaceholder = () => (
  <div className="text-center py-20 bg-white rounded-lg shadow">
    <h2 className="text-2xl font-bold text-gray-800">결제 관리</h2>
    <p className="mt-4 text-gray-500">결제 및 구독 내역을 관리하는 기능이 곧 추가될 예정입니다.</p>
  </div>
);

const MyPage = () => {
    // 기본으로 보여줄 탭을 'account'로 변경합니다.
    const [activeTab, setActiveTab] = useState('account');

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800">마이 페이지</h1>
                {/* 페이지 설명 문구를 수정합니다. */}
                <p className="text-lg text-gray-600 mt-2">계정 정보를 관리하고, 결제 내역을 확인할 수 있습니다.</p>
            </header>

            <div className="mb-8 border-b border-gray-200">
                <nav className="flex space-x-6">
                    {/* '학습 통계' 탭을 '결제 관리' 탭으로 변경합니다. */}
                    <button 
                        onClick={() => setActiveTab('payment')}
                        className={`py-4 px-1 text-lg font-medium transition-colors ${activeTab === 'payment' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                    >
                        결제 관리
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
                {/* '학습 통계' 컴포넌트 대신 '결제 관리' 임시 컴포넌트를 렌더링합니다. */}
                {activeTab === 'payment' && <PaymentManagementPlaceholder />}
                {activeTab === 'account' && <AccountManagementTabPage />}
            </div>
        </div>
    );
};

export default MyPage;