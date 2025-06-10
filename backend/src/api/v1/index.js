/**
 * @file api/v1/index.js
 * @description Combines all v1 API routes and exports a single router module.
 */

const express = require('express');

// v1 API의 모든 라우트 모듈을 불러옵니다.
const authRoutes = require('./auth.routes.js');
const casesRoutes = require('./cases.routes.js');
const mockExamsRoutes = require('./mockExams.routes.js');
const myNotesRoutes = require('./myNotes.routes.js');
const practiceSessionsRoutes = require('./practiceSessions.routes.js');
// 1. 새로 만든 사용자 라우트 모듈을 가져옵니다.
const userRoutes = require('./user.routes.js');

const router = express.Router();

// 각 라우트 모듈을 해당 경로에 연결합니다.
router.use('/auth', authRoutes);
router.use('/cases', casesRoutes);
router.use('/mock-exams', mockExamsRoutes);
router.use('/my-notes', myNotesRoutes);
router.use('/practice-sessions', practiceSessionsRoutes);
// 2. /users 경로로 오는 요청은 userRoutes가 처리하도록 등록합니다.
router.use('/users', userRoutes);

module.exports = router;
