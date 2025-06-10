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
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
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
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['nickname'] }
    ]
  });

  return User;
};
