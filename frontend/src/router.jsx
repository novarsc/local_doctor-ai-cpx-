/**
 * @file router.js
 * @description Defines the application's routes using React Router.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from './features/onboarding/OnboardingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import CaseListPage from './features/cases/CaseListPage';
import PrePracticePage from './features/cases/CasePracticeFlow/PrePracticePage';
import DuringPracticePage from './features/cases/CasePracticeFlow/DuringPracticePage';
import PostPracticePage from './features/cases/CasePracticeFlow/PostPracticePage';
import MockExamMainPage from './features/mock-exam/MockExamMainPage';
import MockExamInProgressPage from './features/mock-exam/MockExamInProgressPage';
import MockExamResultPage from './features/mock-exam/MockExamResultPage';
import BookmarksPage from './features/my-notes/BookmarksPage';
import IncorrectAnswersPage from './features/my-notes/IncorrectAnswersPage';
import LearningHistoryPage from './features/my-notes/LearningHistoryPage';
import MyPage from './features/my-page/MyPage';
import MainLayout from './components/layout/MainLayout'; // MainLayout import
import DashboardPage from './features/dashboard/DashboardPage'; // 새로 추가

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('aichpx_access_token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('aichpx_access_token');
  return !isAuthenticated ? children : <Navigate to="/cases" replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공용 및 로그아웃 상태 전용 라우트 */}
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        
        {/* --- 핵심 변경 부분 --- */}
        {/* 1. 부모 Route가 PrivateRoute와 MainLayout을 책임집니다. */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            {/* 2. 이 안에 있는 자식 Route들은 MainLayout의 <Outlet> 부분에 렌더링됩니다. */}
            <Route path="/dashboard" element={<DashboardPage />} /> // 새로 추가
            <Route path="/cases" element={<CaseListPage />} />
            <Route path="/cases/:scenarioId/practice" element={<PrePracticePage />} />
            <Route path="/cases/:scenarioId/practice/during/:sessionId" element={<DuringPracticePage />} />
            <Route path="/cases/:scenarioId/practice/result" element={<PostPracticePage />} />
            

            <Route path="/mock-exam" element={<MockExamMainPage />} />
            <Route path="/mock-exam/:mockExamSessionId/case/:caseNumber" element={<MockExamInProgressPage />} />
            <Route path="/mock-exam/:mockExamSessionId/result" element={<MockExamResultPage />} />
            
            <Route path="/my-notes" element={<Navigate to="/my-notes/bookmarks" />} />
            <Route path="/my-notes/bookmarks" element={<BookmarksPage />} />
            <Route path="/my-notes/incorrect" element={<IncorrectAnswersPage />} />
            <Route path="/my-notes/history" element={<LearningHistoryPage />} />

            <Route path="/my-page" element={<MyPage />} />
            
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;