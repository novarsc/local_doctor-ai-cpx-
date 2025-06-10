// File: backend/src/models/UserBookmarkedScenario.model.js

const { DataTypes, Model } = require('sequelize');
// 1. DataTypes.UUIDV4를 사용하므로, uuid 라이브러리는 더 이상 필요 없습니다.
// const { v4: uuidv4 } = require('uuid'); 

module.exports = (sequelize) => {
  class UserBookmarkedScenario extends Model {
    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        this.belongsTo(models.Scenario, {
            foreignKey: 'scenarioId',
            as: 'scenario'
        });
    }
  }

  UserBookmarkedScenario.init({
    bookmarkId: {
      type: DataTypes.UUID,
      // 2. 기본값을 Sequelize가 제공하는 UUIDV4 타입으로 변경합니다.
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userId',
      },
    },
    scenarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Scenarios',
        key: 'scenarioId',
      },
    },
  }, {
    sequelize,
    modelName: 'UserBookmarkedScenario',
    tableName: 'UserBookmarkedScenarios',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'scenarioId']
        }
    ]
  });

  return UserBookmarkedScenario;
};
