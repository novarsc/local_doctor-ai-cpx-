/**
 * @file app.js
 * @description Configures the Express application, including middleware and routes.
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport.config');
// v1 통합 라우터를 불러옵니다.
const v1ApiRoutes = require('./api/v1'); 

const app = express();

// 보안 미들웨어 설정
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// MongoDB injection 방지
app.use(mongoSanitize());

// HTTP Parameter Pollution 방지
app.use(hpp());

// Cookie 파서
app.use(cookieParser());

// CORS 설정 강화
app.use(cors({
  origin: function (origin, callback) {
    // 허용된 도메인 목록
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // 개발 환경에서는 origin이 undefined일 수 있음 (Postman 등)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24시간
}));

// Rate limiting 설정
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100개 요청
  message: {
    error: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: '15분'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 로그인 특화 Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 로그인 시도
  message: {
    error: '너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요.',
    retryAfter: '15분'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
});

// 일반 Rate limiting 적용
app.use('/api/', generalLimiter);

// Body parsing 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 세션 설정 강화
app.use(session({
  secret: process.env.SESSION_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET은 프로덕션 환경에서 필수입니다.');
    }
    return 'dev-secret-key';
  })(),
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // 기본 이름 변경으로 보안 강화
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
    httpOnly: true, // XSS 방지
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: 'strict' // CSRF 방지
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 정적 파일 서빙 (프로필 이미지 등)
app.use('/uploads', express.static('public/uploads'));

// 로그인 엔드포인트에 특별한 Rate limiting 적용
app.use('/api/v1/auth/login', loginLimiter);

// API 라우트 설정
// 이제 /api/v1 경로로 오는 모든 요청은 v1 통합 라우터가 처리합니다.
app.use('/api/v1', v1ApiRoutes);

// 기본 라우트 (서버 상태 확인용)
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Not Found 핸들러
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `경로 ${req.originalUrl}을(를) 찾을 수 없습니다.`,
    timestamp: new Date().toISOString()
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  // 민감한 정보 노출 방지
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', err);
  } else {
    console.error('Error:', err.message);
  }
  
  // CORS 에러 처리
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: '허용되지 않은 도메인에서의 요청입니다.'
    });
  }
  
  // 기본 에러 응답
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : '서버에서 오류가 발생했습니다.',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
