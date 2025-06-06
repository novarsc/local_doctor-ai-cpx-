/**
 * @file EvaluationResult.model.js
 * @description Defines the Sequelize model for the 'EvaluationResults' table.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class EvaluationResult extends Model {}

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
