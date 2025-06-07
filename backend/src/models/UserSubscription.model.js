/**
 * @file UserSubscription.model.js
 * @description Defines the Sequelize model for user subscriptions.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class UserSubscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // UserSubscription은 User 모델에 1:1로 속합니다.
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      // UserSubscription은 SubscriptionPlan 모델에 속합니다.
      this.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'planId',
        onDelete: 'SET NULL', // 플랜이 삭제되어도 구독 기록은 남도록 설정
      });
    }
  }

  UserSubscription.init({
    subscriptionId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // 사용자 한 명은 하나의 활성 구독만 가집니다.
      references: {
        model: 'Users',
        key: 'userId',
      },
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'SubscriptionPlans',
        key: 'planId',
      },
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      // [변경됨] 복잡한 SQL 생성을 피하기 위해 주석(comment)을 제거합니다.
      // comment: 'The current status of the subscription',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'The date the subscription started',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'The date the subscription is set to expire',
    },
    autoRenew: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Flag indicating if the subscription will auto-renew'
    }
  }, {
    sequelize,
    modelName: 'UserSubscription',
    tableName: 'UserSubscriptions',
    timestamps: true,
  });

  return UserSubscription;
};
