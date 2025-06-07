// core.config.js

/**
 * 애플리케이션의 핵심 설정을 정의합니다.
 * 환경 변수를 사용하여 유연하게 설정을 변경할 수 있습니다.
 */
module.exports = {
    // 서버 실행 환경 (development, production, test)
    env: process.env.NODE_ENV || 'development',
  
    // 애플리케이션 이름
    appName: process.env.APP_NAME || 'MyAwesomeApp',
  
    // 서버가 실행될 포트
    port: parseInt(process.env.PORT, 10) || 3000,
  
    // 클라이언트 측 URL (CORS 설정 등에 사용)
    clientUrl: process.env.CLIENT_URL || 'http://localhost:8080',
  };