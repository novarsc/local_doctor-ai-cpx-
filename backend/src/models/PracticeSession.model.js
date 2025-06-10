// File: backend/src/models/PracticeSession.model.js

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class PracticeSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        // 실습 세션은 하나의 사용자에게 속합니다. (N:1)
        this.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        // 실습 세션은 하나의 시나리오에 속합니다. (N:1)
        this.belongsTo(models.Scenario, {
            foreignKey: 'scenarioId',
            as: 'scenario'
        });
    }
  }

  PracticeSession.init({
    practiceSessionId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
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
    selectedAiPersonalityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    practiceMode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'started',
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    finalScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'PracticeSession',
    tableName: 'PracticeSessions',
    timestamps: true,
  });

  return PracticeSession;
};
