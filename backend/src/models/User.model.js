/**
 * @file User.model.js
 * @description Defines the Sequelize model for the 'Users' table.
 * This model represents a user in the system, storing credentials and profile information.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { USER_ROLE_ENUM, USER_ROLE } = require('../enums/UserRole.enum');

module.exports = (sequelize) => {
  class User extends Model {}

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
      unique: {
        name: 'users_email_unique',
        msg: 'An account with this email already exists.',
      },
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
      unique: {
        name: 'users_nickname_unique',
        msg: 'This nickname is already in use.',
      },
      comment: 'User\'s display name, must be unique',
    },
    profileImagePath: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL path to the user\'s profile image',
    },
    role: {
      type: DataTypes.ENUM(USER_ROLE_ENUM),
      allowNull: false,
      defaultValue: USER_ROLE.USER,
      comment: 'User role (e.g., USER, ADMIN)',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag indicating if the user has verified their email address',
    },
    // Timestamps are managed by Sequelize automatically (createdAt, updatedAt)
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true, // Enables createdAt and updatedAt fields
    paranoid: false, // Set to true if you want soft deletes (deletedAt field)
  });

  return User;
};
