/**
 * @file User.model.js
 * @description Defines the Sequelize model for the 'Users' table.
 * This model represents a user in the system, storing credentials and profile information.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { USER_ROLE_ENUM, USER_ROLE } = require('../enums/UserRole.enum');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
        // 여기에 다른 모델과의 관계를 정의합니다.
        // 예: this.hasMany(models.PracticeSession, { foreignKey: 'userId' });
    }
  }

  User.init({
    userId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the user (UUID v4)',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // [변경됨] unique 옵션을 여기서 직접 정의하지 않습니다.
      // unique: true,
      validate: {
        isEmail: true,
      },
      comment: 'User\'s email address, used for login',
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hashed password for the user',
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User\'s full name',
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
      // [변경됨] unique 옵션을 여기서 직접 정의하지 않습니다.
      // unique: true,
      comment: 'User\'s display name, must be unique',
    },
    profileImagePath: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL path to the user\'s profile image',
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
      comment: 'Flag indicating if the user has verified their email address',
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    paranoid: false,
    // [추가됨] unique 제약 조건을 indexes 옵션을 통해 별도로 정의합니다.
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['nickname']
      }
    ]
  });

  return User;
};
