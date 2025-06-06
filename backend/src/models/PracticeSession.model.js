/**
 * @file PracticeSession.model.js
 * @description Defines the Sequelize model for the 'PracticeSessions' table.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class PracticeSession extends Model {}

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
        model: 'Users', // This should match the table name of the User model
        key: 'userId',
      },
    },
    scenarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Scenarios', // This should match the table name of the Scenario model
        key: 'scenarioId',
      },
    },
    selectedAiPersonalityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    practiceMode: {
      type: DataTypes.STRING, // "chat" or "audio"
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING, // "started", "completed", "aborted"
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
    timestamps: true, // This will add createdAt and updatedAt fields
  });

  return PracticeSession;
};
