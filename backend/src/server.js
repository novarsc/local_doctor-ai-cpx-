/**
 * @file server.js
 * @description The main entry point for the application server.
 * It initializes the app, connects to the database, and starts listening for requests.
 */

// .env 파일의 환경 변수를 가장 먼저 로드합니다.
require('dotenv').config();

const app = require('./app'); // 같은 src 폴더에 있는 app.js를 불러옵니다.
const { sequelize } = require('./models'); // 같은 src 폴더에 있는 models 폴더를 불러옵니다.

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // (선택사항) 개발 환경에서만 모델과 데이터베이스를 동기화합니다.
    // 주의: { force: true } 옵션은 기존 테이블을 삭제하므로 프로덕션에서는 절대 사용하지 마세요.
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('🛠️  All models were synchronized successfully (alter: true).');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1); // 데이터베이스 연결 실패 시 프로세스 종료
  }
};

startServer();
