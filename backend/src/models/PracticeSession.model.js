// File: backend/src/models/PracticeSession.model.js

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class PracticeSession extends Model {
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

        // --- 이 부분을 추가하세요 ---
        this.belongsTo(models.AIPatientPersonality, {
            foreignKey: 'selectedAiPersonalityId',
            as: 'personality'
        });
        // --- 여기까지 추가 ---
        
        // --- 이 부분을 추가하세요 ---
        // PracticeSession은 하나의 EvaluationResult를 가집니다 (hasOne 관계)
        this.hasOne(models.EvaluationResult, {
          foreignKey: 'practiceSessionId',
          as: 'evaluationResult' // 이 관계에서 사용할 별칭
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
