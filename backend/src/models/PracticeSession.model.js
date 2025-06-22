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
        
        // PracticeSession은 하나의 EvaluationResult를 가집니다 (hasOne 관계)
        this.hasOne(models.EvaluationResult, {
          foreignKey: 'practiceSessionId',
          as: 'evaluationResult' // 이 관계에서 사용할 별칭
        });
        // --- 추가: PracticeSession은 하나의 IncorrectAnswerNote를 가질 수 있음 ---
        this.hasOne(models.IncorrectAnswerNote, {
          foreignKey: 'scenarioId',
          sourceKey: 'scenarioId',
          as: 'incorrectAnswerNote',
          constraints: false, // userId까지 복합키 조인하려면 복잡하므로 우선 scenarioId만 사용
        });
        // UserPracticeHistory와의 관계 추가
        this.hasOne(models.UserPracticeHistory, {
          foreignKey: 'practiceSessionId',
          as: 'practiceHistory'
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
    },
    // 모의고사 관련 필드 추가
    mockExamSessionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'MockExamSessions',
            key: 'mockExamSessionId',
        },
    },
    caseNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 6
        }
    }
  }, {
    sequelize,
    modelName: 'PracticeSession',
    tableName: 'PracticeSessions',
    timestamps: true,
  });

  return PracticeSession;
};
