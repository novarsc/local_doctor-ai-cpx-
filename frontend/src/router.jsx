/**
 * @file router.js
 * @description Defines the application's routes using React Router.
 */

import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';

// 페이지 및 레이아웃 컴포넌트 임포트
import MainLayout from './components/layout/MainLayout';
import MyNotesLayout from './features/my-notes/MyNotesLayout';
import OnboardingPage from './features/onboarding/OnboardingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
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
import LearningStatisticsPage from './features/my-notes/LearningStatisticsPage';
<<<<<<< HEAD
// --- 변경된 부분 끝 ---

=======
import MyPage from './features/my-page/MyPage';
>>>>>>> restore-80f4306

// 인증 관련 컴포넌트
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('aichpx_access_token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('aichpx_access_token');
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// createBrowserRouter를 사용하여 라우트 구조를 객체 형태로 정의
const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      { index: true, element: <OnboardingPage /> },
      {
        path: 'login',
        element: <PublicRoute><LoginPage /></PublicRoute>,
      },
      {
        path: 'register',
        element: <PublicRoute><RegisterPage /></PublicRoute>,
      },
    ]
  },
  {
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'cases', element: <CaseListPage /> },
      { path: 'cases/practice/:scenarioId', element: <PrePracticePage /> },
      { path: 'cases/practice/during/:sessionId', element: <DuringPracticePage /> },
      { path: 'cases/results/:sessionId', element: <PostPracticePage /> },

      { path: 'mock-exams', element: <MockExamMainPage /> },
      { path: 'mock-exams/live/:mockExamSessionId', element: <MockExamInProgressPage /> },
      { path: 'mock-exams/results/:mockExamSessionId', element: <MockExamResultPage /> },

      {
        path: 'my-notes',
        element: <MyNotesLayout />,
        children: [
          { index: true, element: <Navigate to="history" replace /> }, 
          { path: 'bookmarks', element: <BookmarksPage /> },
          { path: 'incorrect', element: <IncorrectAnswersPage /> },
          { path: 'history', element: <LearningHistoryPage /> },
          { path: 'statistics', element: <LearningStatisticsPage /> },
          { path: 'history/case-results/:sessionId', element: <PostPracticePage /> },
          { path: 'history/mock-exam-results/:mockExamSessionId', element: <MockExamResultPage /> },
        ],
      },
      { path: 'my-page', element: <MyPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" /> }
]);

const AppRouter = () => {
<<<<<<< HEAD
  return (
    <BrowserRouter>
      <Routes>
        {/* 공용 및 로그아웃 상태 전용 라우트 */}
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        
        {/* MainLayout을 사용하는 인증된 사용자 전용 라우트 */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cases" element={<CaseListPage />} />
            <Route path="/cases/:scenarioId/practice" element={<PrePracticePage />} />
            <Route path="/cases/:scenarioId/practice/during/:sessionId" element={<DuringPracticePage />} />
            <Route path="/cases/:scenarioId/practice/result" element={<PostPracticePage />} />
            
            <Route path="/mock-exam" element={<MockExamMainPage />} />
            <Route path="/mock-exam/:mockExamSessionId/case/:caseNumber" element={<MockExamInProgressPage />} />
            <Route path="/mock-exam/:mockExamSessionId/result" element={<MockExamResultPage />} />
            
            {/* --- 변경된 부분 시작 --- */}
            {/* 'MY 노트' 라우팅을 MyNotesLayout을 사용하는 중첩 구조로 변경합니다 */}
            <Route path="/my-notes" element={<MyNotesLayout />}>
                {/* /my-notes 접속 시 기본으로 bookmarks 페이지로 이동시킵니다. */}
                <Route index element={<Navigate to="bookmarks" replace />} /> 
                <Route path="bookmarks" element={<BookmarksPage />} />
                <Route path="incorrect" element={<IncorrectAnswersPage />} />
                <Route path="history" element={<LearningHistoryPage />} />
                <Route path="statistics" element={<LearningStatisticsPage />} />
            </Route>
            {/* --- 변경된 부분 끝 --- */}

            <Route path="/my-page" element={<MyPage />} />
            
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
=======
  return <RouterProvider router={router} />;
>>>>>>> restore-80f4306
};

export default AppRouter;
