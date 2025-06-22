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
    return res.status(403).json({ message: 'A token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // 토큰에서 얻은 userId로 사용자 정보를 찾아 req 객체에 저장
    const user = await User.findByPk(decoded.userId);
    if (!user) {
        return res.status(401).json({ message: "Invalid Token: User not found." });
    }
    req.user = user; // 이제 다른 라우터에서 req.user로 사용자 정보에 접근 가능

  } catch (err) {
    return res.status(401).json({ message: 'Invalid Token' });
  }

  return next();
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Requires Admin Role!' });
};

/**
 * 선택적 인증 미들웨어 - 토큰이 있으면 사용자 정보를 설정하고, 없어도 요청을 계속 진행
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 토큰이 없으면 req.user를 null로 설정하고 계속 진행
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보를 데이터베이스에서 조회
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      req.user = null;
      return next();
    }
    
    req.user = {
      userId: user.userId,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 요청을 계속 진행
    req.user = null;
    next();
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  optionalAuth,
};
