/**
 * @file auth.service.js
 * @description Authentication-related business logic (Service Layer)
 * Handles user registration, login, token management, etc.
 */

const { User } = require('../models'); // Assuming models/index.js exports all models
const passwordHasher = require('../utils/passwordHasher');
const tokenManager = require('../utils/tokenManager');
const ApiError = require('../utils/ApiError');
const { USER_ROLE } = require('../enums/UserRole.enum');
const crypto = require('crypto');
const emailService = require('./email.service');

/**
 * Registers a new user.
 * @param {object} userData - The user data for registration.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.password - The user's password.
 * @param {string} userData.fullName - The user's full name.
 * @param {string} userData.nickname - The user's nickname.
 * @returns {Promise<object>} The newly created user object (without password).
 * @throws {ApiError} If the email or nickname already exists.
 */
const registerUser = async (userData) => {
  const { email, password, fullName, nickname } = userData;

  // 1. Check for duplicate email
  const existingUserByEmail = await User.findOne({ where: { email } });
  if (existingUserByEmail) {
    throw new ApiError(409, 'U001_EMAIL_DUPLICATED', 'An account with this email already exists.');
  }

  // 2. Check for duplicate nickname
  const existingUserByNickname = await User.findOne({ where: { nickname } });
  if (existingUserByNickname) {
    throw new ApiError(409, 'U002_NICKNAME_DUPLICATED', 'This nickname is already in use.');
  }

  // 3. Hash the password
  const hashedPassword = await passwordHasher.hashPassword(password);

  // 4. Create the user in the database
  const newUser = await User.create({
    email,
    password: hashedPassword,
    fullName,
    nickname,
    role: USER_ROLE.USER, // Assign default user role
    emailVerified: false, // Email is not verified on registration
  });

  // 5. Return the created user object, excluding the password
  const userObject = newUser.toJSON();
  delete userObject.password;

  return userObject;
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} An object containing access and refresh tokens, and user info.
 * @throws {ApiError} If credentials are invalid.
 */
const loginUser = async (email, password) => {
    // 1. Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new ApiError(401, 'A001_INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // 2. Compare the provided password with the stored hashed password
    const isPasswordValid = await passwordHasher.comparePasswords(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'A001_INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // 3. Generate JWT tokens
    const payload = {
        userId: user.userId,
        role: user.role,
    };
    const accessToken = tokenManager.generateAccessToken(payload);
    const refreshToken = tokenManager.generateRefreshToken(payload);

    // 4. Prepare user info to return
    const userObject = user.toJSON();
    delete userObject.password;

    return {
        accessToken,
        refreshToken,
        user: userObject,
    };
};

/**
 * 네이버 소셜 로그인 처리
 * @param {string} code - 네이버 인증 코드
 * @returns {Promise<object>} 로그인 결과 (토큰 + 사용자 정보)
 */
const naverLogin = async (code) => {
  try {
    // 1. 네이버로부터 액세스 토큰 받기
    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code: code,
        state: 'state', // 실제 구현에서는 state 검증 필요
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new ApiError(400, 'SOCIAL_LOGIN_ERROR', '네이버 로그인에 실패했습니다.');
    }

    // 2. 네이버 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    
    if (!userInfoResponse.ok) {
      throw new ApiError(400, 'SOCIAL_LOGIN_ERROR', '네이버 사용자 정보를 가져올 수 없습니다.');
    }

    // 3. 사용자 정보에서 필요한 데이터 추출
    const naverUser = userInfo.response;
    const email = naverUser.email;
    const fullName = naverUser.name;
    const nickname = naverUser.nickname || fullName;

    // 4. 기존 사용자 확인 또는 새 사용자 생성
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // 새 사용자 생성
      user = await User.create({
        email,
        fullName,
        nickname,
        role: USER_ROLE.USER,
        emailVerified: true, // 소셜 로그인은 이메일 인증된 것으로 간주
        socialProvider: 'naver',
        socialId: naverUser.id,
      });
    }

    // 5. JWT 토큰 생성
    const payload = {
      userId: user.userId,
      role: user.role,
    };
    const accessToken = tokenManager.generateAccessToken(payload);
    const refreshToken = tokenManager.generateRefreshToken(payload);

    // 6. 사용자 정보 반환
    const userObject = user.toJSON();
    delete userObject.password;

    return {
      accessToken,
      refreshToken,
      user: userObject,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'SOCIAL_LOGIN_ERROR', '네이버 로그인 처리 중 오류가 발생했습니다.');
  }
};

/**
 * 카카오 소셜 로그인 처리
 * @param {string} code - 카카오 인증 코드
 * @returns {Promise<object>} 로그인 결과 (토큰 + 사용자 정보)
 */
const kakaoLogin = async (code) => {
  try {
    // 1. 카카오로부터 액세스 토큰 받기
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new ApiError(400, 'SOCIAL_LOGIN_ERROR', '카카오 로그인에 실패했습니다.');
    }

    // 2. 카카오 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    
    if (!userInfoResponse.ok) {
      throw new ApiError(400, 'SOCIAL_LOGIN_ERROR', '카카오 사용자 정보를 가져올 수 없습니다.');
    }

    // 3. 사용자 정보에서 필요한 데이터 추출
    const kakaoUser = userInfo;
    const email = kakaoUser.kakao_account?.email;
    const fullName = kakaoUser.properties?.nickname || '카카오 사용자';
    const nickname = kakaoUser.properties?.nickname || fullName;

    if (!email) {
      throw new ApiError(400, 'SOCIAL_LOGIN_ERROR', '이메일 정보가 필요합니다.');
    }

    // 4. 기존 사용자 확인 또는 새 사용자 생성
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // 새 사용자 생성
      user = await User.create({
        email,
        fullName,
        nickname,
        role: USER_ROLE.USER,
        emailVerified: true, // 소셜 로그인은 이메일 인증된 것으로 간주
        socialProvider: 'kakao',
        socialId: kakaoUser.id.toString(),
      });
    }

    // 5. JWT 토큰 생성
    const payload = {
      userId: user.userId,
      role: user.role,
    };
    const accessToken = tokenManager.generateAccessToken(payload);
    const refreshToken = tokenManager.generateRefreshToken(payload);

    // 6. 사용자 정보 반환
    const userObject = user.toJSON();
    delete userObject.password;

    return {
      accessToken,
      refreshToken,
      user: userObject,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'SOCIAL_LOGIN_ERROR', '카카오 로그인 처리 중 오류가 발생했습니다.');
  }
};

/**
 * 아이디 찾기
 * @param {string} email - 사용자 이메일
 * @returns {Promise<object>} 찾기 결과
 */
const findUserId = async (email) => {
  // 1. 이메일로 사용자 찾기
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', '해당 이메일로 가입된 계정을 찾을 수 없습니다.');
  }

  // 2. 실제 이메일 발송
  await emailService.sendIdEmail(email, user.email);

  return {
    message: '입력하신 이메일로 아이디 정보를 발송했습니다.',
  };
};

/**
 * 비밀번호 찾기 (재설정 링크 발송)
 * @param {string} email - 사용자 이메일
 * @returns {Promise<object>} 찾기 결과
 */
const findUserPassword = async (email) => {
  // 1. 이메일로 사용자 찾기
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', '해당 이메일로 가입된 계정을 찾을 수 없습니다.');
  }

  // 2. 비밀번호 재설정 토큰 생성
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후 만료

  // 3. 토큰을 데이터베이스에 저장 (실제 구현에서는 별도 테이블 사용 권장)
  await user.update({
    resetPasswordToken: resetToken,
    resetPasswordExpires: resetTokenExpiry,
  });

  // 4. 실제 이메일 발송
  await emailService.sendPasswordResetEmail(email, resetToken);

  return {
    message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.',
  };
};

/**
 * 비밀번호 재설정
 * @param {string} token - 재설정 토큰
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<object>} 재설정 결과
 */
const resetPassword = async (token, newPassword) => {
  // 1. 토큰으로 사용자 찾기
  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() },
    },
  });

  if (!user) {
    throw new ApiError(400, 'INVALID_TOKEN', '유효하지 않거나 만료된 토큰입니다.');
  }

  // 2. 새 비밀번호 해시화
  const hashedPassword = await passwordHasher.hashPassword(newPassword);

  // 3. 비밀번호 업데이트 및 토큰 초기화
  await user.update({
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  return {
    message: '비밀번호가 성공적으로 변경되었습니다.',
  };
};

module.exports = {
  registerUser,
  loginUser,
  naverLogin,
  kakaoLogin,
  findUserId,
  findUserPassword,
  resetPassword,
};
