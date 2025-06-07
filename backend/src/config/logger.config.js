// logger.config.js

/**
 * 로깅(logging) 설정을 정의합니다.
 * 실행 환경에 따라 로그 레벨이나 포맷을 다르게 설정할 수 있습니다.
 */
module.exports = {
    // 로그 레벨 (error, warn, info, http, verbose, debug, silly)
    level: process.env.LOG_LEVEL || 'info',
  
    // 로그 포맷 ('json' 또는 'pretty')
    format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
  
    // 로그 파일 저장 경로 (필요한 경우)
    file: {
      enabled: false,
      path: 'logs/app.log',
      maxSize: '20m', // 20MB
      maxFiles: '14d', // 14일간 보관
    },
  };