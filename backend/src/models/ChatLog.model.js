/**
 * @file ChatLog.model.js
 * @description Defines the Sequelize model for storing chat messages from practice sessions.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class ChatLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // ChatLog는 PracticeSession에 속합니다. (1:N 관계)
      this.belongsTo(models.PracticeSession, {
        foreignKey: 'practiceSessionId',
        onDelete: 'CASCADE', // 실습 세션이 삭제되면 관련 채팅 로그도 삭제됩니다.
      });
    }
  }

  ChatLog.init({
    chatLogId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the chat message',
    },
    practiceSessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'PracticeSessions', // 'PracticeSessions' 테이블을 참조합니다.
        key: 'practiceSessionId',
      },
      comment: 'Identifier for the practice session this log belongs to',
    },
    sender: {
      type: DataTypes.ENUM('USER', 'AI'),
      allowNull: false,
      // [변경됨] 복잡한 SQL 생성을 피하기 위해 주석(comment)을 제거합니다.
      // comment: 'The sender of the message (USER or AI)',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The content of the chat message',
    },
  }, {
    sequelize,
    modelName: 'ChatLog',
    tableName: 'ChatLogs',
    timestamps: true,
  });

  return ChatLog;
};
