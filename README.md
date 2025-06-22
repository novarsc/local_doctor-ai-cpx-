# AI CPX Tutor

AI 기반 임상 수행 시험(CPX) 학습 플랫폼

## 주요 기능

- **실제와 같은 시뮬레이션**: 실제 CPX 시험 환경을 모방한 현실적인 임상 시나리오
- **개인별 피드백**: 성능에 대한 자세한 피드백과 개선점 제시
- **진행 상황 추적**: 시간 경과에 따른 학습 진행 상황 추적
- **소셜 로그인**: 네이버, 카카오를 통한 간편한 회원가입/로그인
- **계정 관리**: 아이디/비밀번호 찾기, 비밀번호 재설정 기능

## 기술 스택

### Frontend
- React 18
- Redux Toolkit
- React Router v6
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd Doc_tor
```

### 2. Frontend 설정
```bash
cd frontend
npm install
```

### 3. Frontend 환경 변수 설정
`frontend/env.example` 파일을 참고하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api/v1

# Social Login Configuration
VITE_NAVER_CLIENT_ID=your_naver_client_id
VITE_NAVER_REDIRECT_URI=http://localhost:3000/auth/callback?provider=naver

VITE_KAKAO_CLIENT_ID=your_kakao_client_id
VITE_KAKAO_REDIRECT_URI=http://localhost:3000/auth/callback?provider=kakao

# Other Configuration
VITE_APP_NAME=AI CPX Tutor
```

### 4. Backend 설정
```bash
cd backend
npm install
```

### 5. Backend 환경 변수 설정
`backend/env.example` 파일을 참고하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aichpx_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# Social Login Configuration
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_REDIRECT_URI=http://localhost:3000/auth/callback?provider=kakao

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 6. 데이터베이스 설정
```bash
# PostgreSQL 데이터베이스 생성
createdb aichpx_db

# 데이터베이스 마이그레이션 실행
cd backend
npm run db:reset
```

### 7. 개발 서버 실행
```bash
# Frontend (새 터미널에서)
cd frontend
npm run dev

# Backend (새 터미널에서)
cd backend
npm run dev
```

## 소셜 로그인 설정

### 네이버 로그인
1. [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록
2. Client ID와 Client Secret 발급
3. Callback URL 설정: `http://localhost:3000/auth/callback?provider=naver`
4. 환경 변수에 Client ID와 Secret 설정

### 카카오 로그인
1. [카카오 개발자 센터](https://developers.kakao.com/)에서 애플리케이션 등록
2. Client ID 발급
3. Redirect URI 설정: `http://localhost:3000/auth/callback?provider=kakao`
4. 환경 변수에 Client ID 설정

## 주요 페이지

- **온보딩 페이지** (`/`): 서비스 소개 및 소셜 로그인
- **로그인 페이지** (`/login`): 이메일/비밀번호 로그인, 소셜 로그인, 계정 찾기
- **회원가입 페이지** (`/register`): 일반 회원가입, 소셜 로그인
- **대시보드** (`/dashboard`): 학습 현황 및 통계
- **케이스 연습** (`/cases`): CPX 케이스 목록 및 연습
- **모의고사** (`/mock-exams`): 모의고사 기능
- **마이페이지** (`/my-page`): 개인 정보 관리

## 계정 관리 기능

### 아이디/비밀번호 찾기
- 로그인 페이지에서 "아이디/비밀번호 찾기" 버튼 클릭
- 이메일 주소 입력
- 아이디 찾기: 가입한 이메일로 아이디 정보 발송
- 비밀번호 찾기: 비밀번호 재설정 링크 발송

### 비밀번호 재설정
- 이메일로 받은 링크 클릭
- 새 비밀번호 입력 및 확인
- 비밀번호 변경 완료

## API 엔드포인트

### 인증 관련
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/naver` - 네이버 로그인
- `POST /api/v1/auth/kakao` - 카카오 로그인
- `POST /api/v1/auth/find-id` - 아이디 찾기
- `POST /api/v1/auth/find-password` - 비밀번호 찾기
- `POST /api/v1/auth/reset-password` - 비밀번호 재설정

### 사용자 관련
- `GET /api/v1/users/me` - 내 정보 조회
- `PUT /api/v1/users/me/profile` - 프로필 수정
- `PUT /api/v1/users/me/password` - 비밀번호 변경
- `DELETE /api/v1/users/me` - 계정 삭제

## 데이터베이스 스키마

### Users 테이블
- `userId` (UUID, PK): 사용자 고유 ID
- `email` (STRING): 이메일 주소
- `password` (STRING, nullable): 비밀번호 (소셜 로그인 사용자는 null)
- `fullName` (STRING): 전체 이름
- `nickname` (STRING): 닉네임
- `role` (ENUM): 사용자 역할
- `emailVerified` (BOOLEAN): 이메일 인증 여부
- `socialProvider` (ENUM): 소셜 로그인 제공자 (naver, kakao, google)
- `socialId` (STRING): 소셜 로그인 ID
- `resetPasswordToken` (STRING): 비밀번호 재설정 토큰
- `resetPasswordExpires` (DATE): 비밀번호 재설정 토큰 만료일

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
