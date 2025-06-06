/**
 * @file UserPracticeHistory.model.js
 * @description Defines the Sequelize model for the 'UserPracticeHistory' table.
 * It's a log of every single completed practice session for analytics.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class UserPracticeHistory extends Model {}

  UserPracticeHistory.init({
    historyId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'userId' },
    },
    practiceSessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // Each practice session should only have one history entry
      references: { model: 'PracticeSessions', key: 'practiceSessionId' },
    },
    scenarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Scenarios', key: 'scenarioId' },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true, // Score might not be available if aborted
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'UserPracticeHistory',
    tableName: 'UserPracticeHistories',
    timestamps: false, // completedAt is manually set, no need for createdAt/updatedAt
  });

  return UserPracticeHistory;
};
