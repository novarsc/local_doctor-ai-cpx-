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
import SocialCallbackPage from './features/auth/SocialCallbackPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import DashboardPage from './features/dashboard/DashboardPage';
import CaseListPage from './features/cases/CaseListPage';
import PrePracticePage from './features/cases/CasePracticeFlow/PrePracticePage';
import DuringPracticePage from './features/cases/CasePracticeFlow/DuringPracticePage';
import PostPracticePage from './features/cases/CasePracticeFlow/PostPracticePage';
import MockExamMainPage from './features/mock-exam/MockExamMainPage';
import MockExamPrePracticePage from './features/mock-exam/MockExamPrePracticePage';
import MockExamInProgressPage from './features/mock-exam/MockExamInProgressPage';
import MockExamResultPage from './features/mock-exam/MockExamResultPage';
import MockExamSpecifiedSetupPage from './features/mock-exam/MockExamSpecifiedSetupPage';
import BookmarksPage from './features/my-notes/BookmarksPage';
import IncorrectAnswersPage from './features/my-notes/IncorrectAnswersPage';
import LearningHistoryPage from './features/my-notes/LearningHistoryPage';
import LearningStatisticsPage from './features/my-notes/LearningStatisticsPage';
import MockExamResultHistoryPage from './features/my-notes/MockExamResultHistoryPage';
import MyPage from './features/my-page/MyPage';
import IncorrectAnswersDetailPage from './features/my-notes/IncorrectAnswersDetailPage';

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
      {
        path: 'auth/callback',
        element: <PublicRoute><SocialCallbackPage /></PublicRoute>,
      },
      {
        path: 'login/callback',
        element: <PublicRoute><SocialCallbackPage /></PublicRoute>,
      },
      {
        path: 'auth/reset-password',
        element: <PublicRoute><ResetPasswordPage /></PublicRoute>,
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
      { path: 'mock-exams/specified-setup', element: <MockExamSpecifiedSetupPage /> },
      { path: 'mock-exams/pre-practice/:mockExamSessionId/:caseNumber', element: <MockExamPrePracticePage /> },
      { path: 'mock-exams/live/:mockExamSessionId/:caseNumber', element: <MockExamInProgressPage /> },
      { path: 'mock-exams/results/:mockExamSessionId', element: <MockExamResultPage /> },

      {
        path: 'my-notes',
        element: <MyNotesLayout />,
        children: [
          { index: true, element: <Navigate to="bookmarks" replace /> }, 
          { path: 'bookmarks', element: <BookmarksPage /> },
          { path: 'incorrect', element: <IncorrectAnswersPage /> },
          { path: 'incorrect/:scenarioId/detail', element: <IncorrectAnswersDetailPage /> },
          { path: 'history', element: <LearningHistoryPage /> },
          { path: 'statistics', element: <LearningStatisticsPage /> },
          { path: 'history/case-results/:sessionId', element: <PostPracticePage /> },
          { path: 'history/mock-exam-results/:mockExamSessionId', element: <MockExamResultHistoryPage /> },
        ],
      },
      { path: 'my-page', element: <MyPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" /> }
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
