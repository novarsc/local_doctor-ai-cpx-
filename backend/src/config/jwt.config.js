// jwt.config.js

/**
 * JSON Web Token (JWT) 설정을 정의합니다.
 * 비밀 키는 절대로 코드에 하드코딩하지 마세요.
 */
module.exports = {
    // JWT 서명에 사용할 비밀 키
    secret: process.env.JWT_SECRET,
  
    // Access Token 만료 시간 (예: 1시간)
    accessTokenExpiresIn: '1h',
  
    // Refresh Token 만료 시간 (예: 14일)
    refreshTokenExpiresIn: '14d',
  
    // 토큰 발급자
    issuer: 'MyAwesomeApp',
  };