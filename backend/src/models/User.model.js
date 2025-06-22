// File: backend/src/models/User.model.js

'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { USER_ROLE_ENUM, USER_ROLE } = require('../enums/UserRole.enum');

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 사용자는 여러 개의 실습 세션을 가질 수 있습니다 (1:N)
      this.hasMany(models.PracticeSession, {
        foreignKey: 'userId',
        as: 'practiceSessions'
      });
      // 사용자는 여러 개의 북마크를 가질 수 있습니다 (1:N)
      this.hasMany(models.UserBookmarkedScenario, {
        foreignKey: 'userId',
        as: 'bookmarks'
      });
    }
  }

  User.init({
    userId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true, },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // 소셜 로그인 사용자는 비밀번호가 없을 수 있음
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profileImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileImagePath: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLE_ENUM),
      allowNull: false,
      defaultValue: USER_ROLE.USER,
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    // 소셜 로그인 관련 필드
    socialProvider: {
      type: DataTypes.ENUM('naver', 'kakao', 'google'),
      allowNull: true,
    },
    socialId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // 비밀번호 재설정 관련 필드
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['nickname'] },
      { fields: ['socialProvider', 'socialId'] }, // 소셜 로그인 조회용 인덱스
      { fields: ['resetPasswordToken'] } // 비밀번호 재설정 토큰 조회용 인덱스
    ]
  });

  return User;
};
