const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid'); // uuidv4 import 추가

module.exports = (sequelize) => {
  class UserPracticeHistory extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.Scenario, { foreignKey: 'scenarioId', as: 'scenario' });
      this.belongsTo(models.AIPatientPersonality, { foreignKey: 'aiPatientPersonalityId', as: 'personality' });
      this.hasOne(models.EvaluationResult, { foreignKey: 'practiceSessionId', as: 'evaluationResult' });
    }
  }

  UserPracticeHistory.init(
    {
      historyId: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // defaultValue를 함수로 변경
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
      // --- [수정된 부분 1] ---
      scenarioId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Scenarios',
          key: 'scenarioId', // 'id' -> 'scenarioId' 로 수정
        },
      },
      // --- [여기까지 수정] ---
      practiceSessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      // --- [수정된 부분 2] ---
      aiPatientPersonalityId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'AIPatientPersonalities',
          key: 'personalityId', // 'id' -> 'personalityId' 로 수정
        },
      },
      // --- [여기까지 수정] ---
      score: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: { 
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'UserPracticeHistory',
      tableName: 'user_practice_histories',
      timestamps: false,
    }
  );

  return UserPracticeHistory;
};