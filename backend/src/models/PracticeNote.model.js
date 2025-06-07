/**
 * @file PracticeNote.model.js
 * @description Defines the Sequelize model for notes taken during a practice session.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class PracticeNote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // PracticeNote는 PracticeSession에 속합니다. (1:N 관계)
      this.belongsTo(models.PracticeSession, {
        foreignKey: 'practiceSessionId',
        onDelete: 'CASCADE', // 실습 세션이 삭제되면 관련 메모도 삭제됩니다.
      });
    }
  }

  PracticeNote.init({
    practiceNoteId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the practice note',
    },
    practiceSessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'PracticeSessions', // 'PracticeSessions' 테이블을 참조합니다.
        key: 'practiceSessionId',
      },
      comment: 'The practice session this note belongs to',
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'The content of the note taken by the user',
    },
    chatMessageIdLink: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Optional link to a specific chat message ID for context',
    },
  }, {
    sequelize,
    modelName: 'PracticeNote',
    tableName: 'PracticeNotes',
    timestamps: true, // createdAt, updatedAt 필드 활성화
  });

  return PracticeNote;
};
