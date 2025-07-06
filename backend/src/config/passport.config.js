/**
 * @file passport.config.js
 * @description Passport 소셜 로그인 설정 (네이버, 구글, 카카오)
 */

const passport = require('passport');
const NaverStrategy = require('passport-naver').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const { User } = require('../models');

// 사용자 정보 직렬화 (세션에 저장)
passport.serializeUser((user, done) => {
  done(null, user.userId);
});

// 사용자 정보 역직렬화 (세션에서 복원)
passport.deserializeUser(async (userId, done) => {
  try {
    const user = await User.findByPk(userId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// 네이버 OAuth 전략 (환경 변수가 설정된 경우에만)
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: process.env.NAVER_CALLBACK_URL || '/api/v1/auth/naver/callback',
    scope: ['email', 'nickname', 'profile_image', 'birthday', 'gender', 'name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 개발 환경에서만 상세 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log('네이버 프로필 ID:', profile.id);
        console.log('네이버 이메일:', profile.emails?.[0]?.value);
      }
      
      // 기존 사용자 확인
      let user = await User.findOne({
        where: {
          socialProvider: 'naver',
          socialId: profile.id
        }
      });

      if (user) {
        // 기존 사용자 로그인
        return done(null, user);
      }

      // 네이버 프로필 정보 안전하게 추출
      const email = profile.emails?.[0]?.value || profile._json?.email;
      const name = profile._json?.name || profile.displayName;
      const nickname = profile._json?.nickname || name || `네이버사용자_${profile.id.slice(-8)}`;
      const profileImage = profile._json?.profile_image || profile.photos?.[0]?.value;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('추출된 정보:', { email: email ? '***' : 'none', name, nickname });
      }
      
      if (!email) {
        console.error('네이버 로그인: 이메일 정보가 없습니다.');
        return done(new Error('이메일 정보를 받을 수 없습니다. 네이버 개발자센터에서 이메일 제공 설정을 확인해주세요.'), null);
      }

      // 이메일로 기존 사용자 확인
      const existingUser = await User.findOne({
        where: { email }
      });

      if (existingUser) {
        if (process.env.NODE_ENV === 'development') {
          console.log('기존 사용자에 네이버 계정 연결');
        }
        // 기존 사용자에 소셜 정보 연결
        existingUser.socialProvider = 'naver';
        existingUser.socialId = profile.id;
        await existingUser.save();
        return done(null, existingUser);
      }

      // 새 사용자 생성
      user = await User.create({
        email,
        fullName: name || nickname,
        nickname,
        socialProvider: 'naver',
        socialId: profile.id,
        profileImageUrl: profileImage,
        emailVerified: true
      });      

      return done(null, user);
    } catch (error) {
      console.error('네이버 로그인 오류:', error.message);
      return done(error, null);
    }
  }));
} else {
  console.warn('네이버 로그인 설정이 없습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정하세요.');
}

// 구글 OAuth 전략 (환경 변수가 설정된 경우에만)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 개발 환경에서만 상세 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log('구글 프로필 ID:', profile.id);
        console.log('구글 이메일:', profile.emails?.[0]?.value);
      }
      
      // 기존 사용자 확인
      let user = await User.findOne({
        where: {
          socialProvider: 'google',
          socialId: profile.id
        }
      });

      if (user) {
        // 기존 사용자 로그인
        return done(null, user);
      }

      // 이메일로 기존 사용자 확인
      const existingUser = await User.findOne({
        where: { email: profile.emails[0].value }
      });

      if (existingUser) {
        // 기존 사용자에 소셜 정보 연결
        existingUser.socialProvider = 'google';
        existingUser.socialId = profile.id;
        await existingUser.save();
        return done(null, existingUser);
      }

      // 새 사용자 생성
      user = await User.create({
        email: profile.emails[0].value,
        fullName: profile.displayName,
        nickname: profile.displayName,
        socialProvider: 'google',
        socialId: profile.id,
        profileImageUrl: profile.photos[0]?.value,
        emailVerified: true
      });

      return done(null, user);
    } catch (error) {
      console.error('구글 로그인 오류:', error.message);
      return done(error, null);
    }
  }));
} else {
  console.warn('구글 로그인 설정이 없습니다. GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 설정하세요.');
}

// 카카오 OAuth 전략 (환경 변수가 설정된 경우에만)
if (process.env.KAKAO_CLIENT_ID) {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    callbackURL: process.env.KAKAO_CALLBACK_URL || '/api/v1/auth/kakao/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 개발 환경에서만 상세 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log('카카오 프로필 ID:', profile.id);
        console.log('카카오 이메일:', profile._json.kakao_account?.email);
      }
      
      // 카카오에서 받은 숫자 ID를 문자열로 변환합니다. (카카오는 다른 플랫폼과 달리 숫자 형태의 ID를 제공)
      const socialIdString = String(profile.id);
      
      // 기존 사용자 확인
      let user = await User.findOne({
        where: {
          socialProvider: 'kakao',
          socialId: socialIdString
        }
      });

      if (user) {
        // 기존 사용자 로그인
        return done(null, user);
      }

      // 이메일로 기존 사용자 확인 (카카오는 이메일이 없을 수 있음)
      const email = profile._json.kakao_account?.email;
      let existingUser = null;
      
      if (email) {
        existingUser = await User.findOne({
          where: { email }
        });
      }

      if (existingUser) {
        // 기존 사용자에 소셜 정보 연결
        existingUser.socialProvider = 'kakao';
        existingUser.socialId = socialIdString; // 여기도 문자열로 저장
        await existingUser.save();
        return done(null, existingUser);
      }

      // 새 사용자 생성
      const userData = {
        fullName: profile.displayName,
        nickname: profile.displayName,
        socialProvider: 'kakao',
        socialId: socialIdString, // DB에 저장할 때도 문자열로 저장
        profileImageUrl: profile._json.properties?.profile_image,
        emailVerified: true
      };

      // 이메일이 있는 경우만 추가
      if (email) {
        userData.email = email;
      } else {
        // 카카오에서 이메일이 없는 경우 임시 이메일 생성
        userData.email = `kakao_${socialIdString}@temp.com`;
      }

      user = await User.create(userData);

      return done(null, user);
    } catch (error) {
      console.error('카카오 로그인 오류:', error.message);
      return done(error, null);
    }
  }));
} else {
  console.warn('카카오 로그인 설정이 없습니다. KAKAO_CLIENT_ID를 설정하세요.');
}

module.exports = passport; 