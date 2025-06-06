/**
 * @file UserBookmarkedScenario.model.js
 * @description Defines the Sequelize model for the 'UserBookmarkedScenarios' join table.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class UserBookmarkedScenario extends Model {}

  UserBookmarkedScenario.init({
    bookmarkId: {
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
  }, {
    sequelize,
    modelName: 'UserBookmarkedScenario',
    tableName: 'UserBookmarkedScenarios',
    timestamps: true, // Adds createdAt (as bookmarkedAt) and updatedAt
    indexes: [
        {
            unique: true,
            fields: ['userId', 'scenarioId']
        }
    ]
  });

  return UserBookmarkedScenario;
};
