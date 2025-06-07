/**
 * @file PaymentHistory.model.js
 * @description Defines the Sequelize model for storing user payment history.
 */
'use strict';
// [변경됨] Op를 sequelize에서 직접 가져옵니다.
const { Model, DataTypes, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class PaymentHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // PaymentHistory는 User에 속합니다.
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'SET NULL', // 사용자가 탈퇴해도 결제 내역은 남도록 설정
      });

      // (선택사항) UserSubscription과 연결할 수 있습니다.
      this.belongsTo(models.UserSubscription, {
        foreignKey: 'subscriptionId',
        onDelete: 'SET NULL',
      });
    }
  }

  PaymentHistory.init({
    paymentHistoryId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // 사용자가 삭제되어도 기록은 남아야 하므로 allowNull: true
      references: {
        model: 'Users',
        key: 'userId',
      },
    },
    subscriptionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'UserSubscriptions',
            key: 'subscriptionId'
        }
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the purchased product (e.g., "월 구독", "1년 이용권")',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'The amount paid',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Payment method used (e.g., "카카오페이", "현대카드")',
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'REFUNDED'),
      allowNull: false,
      defaultValue: 'SUCCESS',
    },
    pgTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Transaction ID from the payment gateway',
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'The date and time the payment was made'
    }
  }, {
    sequelize,
    modelName: 'PaymentHistory',
    tableName: 'PaymentHistories',
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['pgTransactionId'],
            where: {
                pgTransactionId: {
                    // [변경됨] DataTypes.Op.ne -> Op.ne
                    [Op.ne]: null
                }
            }
        }
    ]
  });

  return PaymentHistory;
};
