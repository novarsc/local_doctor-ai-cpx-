/**
 * @file router.js
 * @description Defines the application's routes using React Router.
 */

import React from 'react';
// 1. 라우터 생성 방식 변경: createBrowserRouter와 RouterProvider를 사용합니다.
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';

// 페이지 및 레이아웃 컴포넌트 임포트
import MainLayout from './components/layout/MainLayout';
import MyNotesLayout from './features/my-notes/MyNotesLayout'; // MY 노트 전용 레이아웃 임포트
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
import MyPage from './features/my-page/MyPage';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './features/dashboard/DashboardPage';

// --- 변경된 부분 시작 ---
// 'MY 노트' 관련 컴포넌트들을 모두 import 합니다.
import MyNotesLayout from './features/my-notes/MyNotesLayout';
import BookmarksPage from './features/my-notes/BookmarksPage';
import IncorrectAnswersPage from './features/my-notes/IncorrectAnswersPage';
import LearningHistoryPage from './features/my-notes/LearningHistoryPage';
import LearningStatisticsPage from './features/my-notes/LearningStatisticsPage';
// --- 변경된 부분 끝 ---


// 2. 인증 관련 컴포넌트는 그대로 사용합니다.
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('aichpx_access_token');
  // Outlet을 사용하기 위해 children을 직접 렌더링하는 대신 Outlet을 반환하도록 수정할 수 있습니다.
  // 또는 children을 그대로 두어도 중첩 라우트의 element로 동작합니다.
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('aichpx_access_token');
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// 3. createBrowserRouter를 사용하여 라우트 구조를 객체 형태로 정의합니다.
const router = createBrowserRouter([
  {
    path: '/',
    // 로그인/온보딩 등 공용 라우트
    element: <Outlet />, // 최상위에는 Outlet을 두어 자식 라우트를 렌더링합니다.
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
    // 인증이 필요한 모든 페이지는 이 라우트의 자식으로 둡니다.
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'cases', element: <CaseListPage /> },
      // API 명세와 일관성을 위해 URL 파라미터를 명확히 합니다.
      { path: 'cases/practice/:scenarioId', element: <PrePracticePage /> },
      { path: 'cases/practice/during/:sessionId', element: <DuringPracticePage /> },
      { path: 'cases/results/:sessionId', element: <PostPracticePage /> },

      { path: 'mock-exams', element: <MockExamMainPage /> },
      { path: 'mock-exams/live/:mockExamSessionId', element: <MockExamInProgressPage /> },
      { path: 'mock-exams/results/:mockExamSessionId', element: <MockExamResultPage /> },

      {
        // 4. 'MY 노트'를 위한 중첩 라우팅 설정
        path: 'my-notes',
        element: <MyNotesLayout />, // 부모 레이아웃을 설정합니다.
        children: [
          // 기본 경로는 '나의 학습 활동'으로 리다이렉트합니다.
          { index: true, element: <Navigate to="history" replace /> }, 
          { path: 'bookmarks', element: <BookmarksPage /> },
          { path: 'incorrect-answers', element: <IncorrectAnswersPage /> },
          { path: 'history', element: <LearningHistoryPage /> },
          // 학습 기록에서 볼 상세 결과 페이지 경로를 자식으로 추가합니다.
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
};

export default AppRouter;
