/**
 * @file AIPatientPersonality.model.js
 * @description Defines the Sequelize model for AI patient personalities.
 * This model stores a path to the personality definition file.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class AIPatientPersonality extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  AIPatientPersonality.init({
    personalityId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the AI personality profile',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // [변경됨] unique 옵션을 여기서 직접 정의하지 않습니다.
      // unique: true, 
      comment: 'Human-readable name for the personality (e.g., "Anxious Patient")',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the personality traits and behaviors.',
    },
    promptFilePath: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Path to the YAML/JSON file that defines the AI personality.',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Flag to determine if this personality is available for use.',
    },
  }, {
    sequelize,
    modelName: 'AIPatientPersonality',
    tableName: 'AIPatientPersonalities',
    timestamps: true,
    paranoid: false,
    // [추가됨] unique 제약 조건을 indexes 옵션을 통해 별도로 정의합니다.
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  return AIPatientPersonality;
};
