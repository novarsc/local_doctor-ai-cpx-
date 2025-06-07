/**
 * @file SubscriptionPlan.model.js
 * @description Defines the Sequelize model for subscription plans available for purchase.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class SubscriptionPlan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 각 플랜은 여러 사용자 구독(UserSubscription)을 가질 수 있습니다.
      this.hasMany(models.UserSubscription, {
        foreignKey: 'planId',
      });
    }
  }

  SubscriptionPlan.init({
    planId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // [변경됨] unique 옵션을 여기서 직접 정의하지 않습니다.
      // unique: true,
      comment: 'Name of the subscription plan (e.g., "월 구독")',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the plan\'s features',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'The price of the plan',
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration of the plan in months (e.g., 1 for monthly, 12 for yearly)',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Flag to determine if this plan is available for purchase',
    },
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'SubscriptionPlans',
    timestamps: true,
    // [추가됨] unique 제약 조건을 indexes 옵션을 통해 별도로 정의합니다.
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  return SubscriptionPlan;
};
