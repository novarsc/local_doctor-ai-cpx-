/**
 * @file MockExamSession.model.js
 * @description Defines the Sequelize model for the 'MockExamSessions' table.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class MockExamSession extends Model {}

  MockExamSession.init({
    mockExamSessionId: {
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
    examType: {
      type: DataTypes.STRING, // "random" or "specified"
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING, // "started", "completed", "aborted"
      allowNull: false,
      defaultValue: 'started',
    },
    selectedScenariosDetails: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of objects, e.g., [{scenarioId, primaryCategory, secondaryCategory, practiceSessionId, score}]',
    },
    overallScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'The average or total score of all scenarios in the mock exam',
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
  }, {
    sequelize,
    modelName: 'MockExamSession',
    tableName: 'MockExamSessions',
    timestamps: true,
  });

  return MockExamSession;
};
