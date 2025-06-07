/**
 * @file app.js
 * @description Configures the Express application, including middleware and routes.
 */

const express = require('express');
const cors = require('cors');
// v1 통합 라우터를 불러옵니다.
const v1ApiRoutes = require('./api/v1'); 

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우트 설정
// 이제 /api/v1 경로로 오는 모든 요청은 v1 통합 라우터가 처리합니다.
app.use('/api/v1', v1ApiRoutes);

// 기본 라우트 (서버 상태 확인용)
app.get('/', (req, res) => {
  res.status(200).send('Server is running!');
});

// 404 Not Found 핸들러
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});


module.exports = app;
