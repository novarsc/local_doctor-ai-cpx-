/**
 * @file EvaluationResult.model.js
 * @description Defines the Sequelize model for the 'EvaluationResults' table.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class EvaluationResult extends Model {
    // 이 부분을 추가하거나, 기존의 비어있는 associate 함수를 교체합니다.
    static associate(models) {
      // EvaluationResult는 PracticeSession에 속합니다 (belongsTo 관계)
      this.belongsTo(models.PracticeSession, {
        foreignKey: 'practiceSessionId',
        as: 'practiceSession' // 서비스 로직에서 사용하는 별칭과 일치시킵니다.
      });
    }
  }


  EvaluationResult.init({
    resultId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    practiceSessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // A session should only have one evaluation result
      references: {
        model: 'PracticeSessions',
        key: 'practiceSessionId',
      },
    },
    overallScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qualitativeFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Storing complex data like arrays of objects is best done with JSON/JSONB
    performanceByCriteria: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    checklistResults: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    goodPoints: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    improvementAreas: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'EvaluationResult',
    tableName: 'EvaluationResults',
    timestamps: true, // Will add createdAt for evaluation timestamp
  });

  return EvaluationResult;
};
