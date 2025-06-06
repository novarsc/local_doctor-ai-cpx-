/**
 * @file IncorrectAnswerNote.model.js
 * @description Defines the Sequelize model for the 'IncorrectAnswerNotes' table.
 * This stores user-written notes for specific scenarios.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class IncorrectAnswerNote extends Model {}

  IncorrectAnswerNote.init({
    noteId: {
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
    userMemo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User-written memo content for the incorrect answer note.',
    },
  }, {
    sequelize,
    modelName: 'IncorrectAnswerNote',
    tableName: 'IncorrectAnswerNotes',
    timestamps: true, // Adds createdAt and updatedAt
    indexes: [
        {
            unique: true,
            fields: ['userId', 'scenarioId'] // A user should have only one note per scenario
        }
    ]
  });

  return IncorrectAnswerNote;
};
