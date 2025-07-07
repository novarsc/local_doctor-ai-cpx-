/**
 * @file auth.middleware.js
 * @description Middleware for authenticating users with JSON Web Tokens (JWT).
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt.config');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication Required',
      message: '인증 토큰이 필요합니다.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // 토큰 만료 시간 추가 체크
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ 
        error: 'Token Expired',
        message: '토큰이 만료되었습니다.',
        timestamp: new Date().toISOString()
      });
    }
    
    // 토큰 발급자 확인
    if (decoded.iss !== jwtConfig.issuer) {
      return res.status(401).json({ 
        error: 'Invalid Token',
        message: '유효하지 않은 토큰입니다.',
        timestamp: new Date().toISOString()
      });
    }
    
    // 토큰에서 얻은 userId로 사용자 정보를 찾아 req 객체에 저장
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'User Not Found',
        message: '사용자를 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
      });
    }
    
    // 사용자 계정이 활성 상태인지 확인 (필요시)
    // if (user.isActive === false) {
    //   return res.status(401).json({ 
    //     error: 'Account Disabled',
    //     message: '비활성화된 계정입니다.',
    //     timestamp: new Date().toISOString()
    //   });
    // }
    
    req.user = user; // 이제 다른 라우터에서 req.user로 사용자 정보에 접근 가능
    req.tokenPayload = decoded; // 토큰 정보도 함께 저장

  } catch (err) {
    let errorMessage = '유효하지 않은 토큰입니다.';
    let errorCode = 'Invalid Token';
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = '토큰이 만료되었습니다.';
      errorCode = 'Token Expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = '잘못된 토큰 형식입니다.';
      errorCode = 'Malformed Token';
    } else if (err.name === 'NotBeforeError') {
      errorMessage = '토큰이 아직 유효하지 않습니다.';
      errorCode = 'Token Not Active';
    }
    
    return res.status(401).json({ 
      error: errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  return next();
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ 
    error: 'Insufficient Permissions',
    message: '관리자 권한이 필요합니다.',
    timestamp: new Date().toISOString()
  });
};

/**
 * 선택적 인증 미들웨어 - 토큰이 있으면 사용자 정보를 설정하고, 없어도 요청을 계속 진행
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // 토큰이 없어도 계속 진행
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // 토큰 발급자 확인
    if (decoded.iss !== jwtConfig.issuer) {
      return next(); // 유효하지 않은 토큰이면 인증 없이 계속 진행
    }
    
    const user = await User.findByPk(decoded.userId);
    if (user) {
      req.user = user;
      req.tokenPayload = decoded;
    }
  } catch (err) {
    // 토큰 검증 실패 시에도 요청을 계속 진행 (에러 없이)
    if (process.env.NODE_ENV === 'development') {
      console.log('Optional auth failed:', err.message);
    }
  }

  return next();
};

module.exports = {
  verifyToken,
  isAdmin,
  optionalAuth
};
