/**
 * @file UserAnalytics.model.js
 * @description Defines the Sequelize model for storing pre-computed user analytics data.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class UserAnalytics extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // UserAnalytics는 User 모델에 1:1로 속합니다.
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
    }
  }

  UserAnalytics.init({
    userAnalyticsId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // 사용자 한 명당 분석 데이터는 하나만 존재합니다.
      references: {
        model: 'Users',
        key: 'userId',
      },
    },
    strengths: {
      type: DataTypes.JSON, // ['병력 청취', '환자 공감'] 와 같은 배열을 저장합니다.
      allowNull: true,
      comment: 'Array of keywords representing user\'s strengths',
    },
    weaknesses: {
      type: DataTypes.JSON, // ['신체 진찰', '감별 진단'] 와 같은 배열을 저장합니다.
      allowNull: true,
      comment: 'Array of keywords representing user\'s weaknesses',
    },
    // 예: { date: '2025-06-01', score: 85 }, { date: '2025-06-03', score: 90 }
    scoreTrendData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Data for plotting score trends over time'
    },
    lastAnalyzedAt: {
        type: DataTypes.DATE,
        comment: 'The timestamp when the analytics were last updated'
    }
  }, {
    sequelize,
    modelName: 'UserAnalytics',
    tableName: 'UserAnalytics',
    timestamps: true, // createdAt, updatedAt 필드 활성화
  });

  return UserAnalytics;
};
