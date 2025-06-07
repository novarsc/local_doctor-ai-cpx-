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


module.exports = {
  verifyToken,
  isAdmin,
};
