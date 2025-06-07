// .env 파일의 환경 변수를 로드합니다.
require('dotenv').config();

/**
 * Sequelize 데이터베이스 연결 설정 파일입니다.
 * 이 파일은 development, test, production 세 가지 환경에 대한
 * 데이터베이스 연결 정보를 정의합니다.
 * models/index.js 파일에서 이 설정을 참조하여 Sequelize를 초기화합니다.
 */
module.exports = {
  // 개발 환경 설정
  development: {
    username: 'postgres', // 'postgres' 사용자로 변경
    // 로컬 postgres 사용자는 비밀번호가 필요 없을 수 있습니다.
    // 비밀번호가 설정된 경우, .env 파일에 DEV_DB_PASSWORD를 정의하세요.
    password: process.env.DEV_DB_PASSWORD || null,
    database: 'doc_tor_db',
    host: '127.0.0.1', // 또는 'localhost'
    dialect: 'postgres',
    // Sequelize가 실행하는 모든 쿼리를 콘솔에 로깅합니다.
    // 디버깅에 유용하지만, 원치 않으면 false로 설정하세요.
    logging: console.log,
  },
  // 테스트 환경 설정
  test: {
    username: 'postgres', // 'postgres' 사용자로 변경
    password: process.env.TEST_DB_PASSWORD || null,
    database: 'doc_tor_db_test', // 테스트용 데이터베이스는 분리하는 것이 좋습니다.
    host: '127.0.0.1',
    dialect: 'postgres',
    // 테스트 실행 중에는 SQL 쿼리 로깅을 비활성화합니다.
    logging: false,
  },
  // 프로덕션(배포) 환경 설정
  production: {
    // DATABASE_URL 환경 변수를 사용하여 데이터베이스에 연결합니다.
    // (예: 'postgres://user:pass@example.com:5432/dbname')
    // Heroku, AWS 등 많은 호스팅 서비스에서 이 방식을 사용합니다.
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      // 프로덕션 환경에서는 보통 SSL 연결이 필요합니다.
      ssl: {
        require: true,
        rejectUnauthorized: false, // 호스팅 환경에 따라 이 옵션이 필요할 수 있습니다.
      },
    },
    // 프로덕션에서는 성능을 위해 로깅을 비활성화합니다.
    logging: false,
  },
};
