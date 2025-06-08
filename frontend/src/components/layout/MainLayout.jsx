import React from 'react';
import { Outlet } from 'react-router-dom';
import GlobalNavigationBar from '../common/GlobalNavigationBar'; // GNB -> GlobalNavigationBar 로 변경
import Footer from '../common/Footer'; // 1. Footer를 import 합니다.

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <GlobalNavigationBar />
      {/* main 영역이 남은 공간을 모두 차지하도록 flex-grow 적용 */}
      <main className="flex-grow">
        <Outlet />
      </main>
      {/* 2. main 영역 아래에 Footer를 추가합니다. */}
      <Footer />
    </div>
  );
};

export default MainLayout;