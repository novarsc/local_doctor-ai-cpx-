/**
 * @file tokenManager.js
 * @description jsonwebtoken 라이브러리를 사용한 JWT 생성 및 관리를 위한 유틸리티
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * Access Token을 생성합니다.
 * @param {object} payload - 토큰에 담을 정보 (e.g., { userId, role })
 * @returns {string} 생성된 Access Token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.accessTokenExpiresIn,
    issuer: jwtConfig.issuer,
  });
};

/**
 * Refresh Token을 생성합니다.
 * @param {object} payload - 토큰에 담을 정보 (e.g., { userId, role })
 * @returns {string} 생성된 Refresh Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshTokenExpiresIn,
    issuer: jwtConfig.issuer,
  });
};

/**
 * 토큰을 검증합니다.
 * @param {string} token - 검증할 토큰
 * @returns {object|null} 검증 성공 시 payload, 실패 시 null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};