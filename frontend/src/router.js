/**
 * @file router.js
 * @description Defines the application's routes using React Router.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import LearningHistoryPage from './features/my-notes/LearningHistoryPage'; // Newly imported

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('aichpx_access_token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/cases" />} />

        {/* --- Protected Routes --- */}
        <Route path="/cases" element={<PrivateRoute><CaseListPage /></PrivateRoute>} />
        <Route path="/cases/:scenarioId/practice" element={<PrivateRoute><PrePracticePage /></PrivateRoute>} />
        <Route path="/cases/:scenarioId/practice/during" element={<PrivateRoute><DuringPracticePage /></PrivateRoute>} />
        <Route path="/cases/:scenarioId/practice/result" element={<PrivateRoute><PostPracticePage /></PrivateRoute>} />

        <Route path="/mock-exam" element={<PrivateRoute><MockExamMainPage /></PrivateRoute>} />
        <Route path="/mock-exam/:mockExamSessionId/case/:caseNumber" element={<PrivateRoute><MockExamInProgressPage /></PrivateRoute>} />
        <Route path="/mock-exam/:mockExamSessionId/result" element={<PrivateRoute><MockExamResultPage /></PrivateRoute>} />

        {/* My Notes Flow */}
        <Route path="/my-notes" element={<Navigate to="/my-notes/bookmarks" />} />
        <Route path="/my-notes/bookmarks" element={<PrivateRoute><BookmarksPage /></PrivateRoute>} />
        <Route path="/my-notes/incorrect" element={<PrivateRoute><IncorrectAnswersPage /></PrivateRoute>} />
        <Route path="/my-notes/history" element={<PrivateRoute><LearningHistoryPage /></PrivateRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
