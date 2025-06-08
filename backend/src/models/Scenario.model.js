/**
 * @file Scenario.model.js
 * @description Defines the Sequelize model for the 'Scenarios' table.
 */

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class Scenario extends Model {}

  Scenario.init({
    scenarioId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the scenario (UUID v4)',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The name or title of the scenario (e.g., 급성 복통 환자)',
    },
    shortDescription: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'A brief, one-line description of the patient\'s chief complaint',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'A more detailed description of the scenario situation',
    },
    primaryCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The main medical category (e.g., 소화기, 순환기)',
    },
    secondaryCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The sub-category within the main category (e.g., 급성 복통)',
    },
    patientInfo: {
      type: DataTypes.JSON, // Use JSONB in PostgreSQL for better performance
      allowNull: true,
      comment: 'Structured patient data including demographics, history, and vital signs',
    },
    defaultAiPersonalityId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'FK to the default AI personality for this scenario',
    },
    keywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'An array of keywords for search functionality',
    },
    caseFilePath: {
        type: DataTypes.STRING,
        allowNull: true, // 나중에 필수로 변경 가능합니다.
        comment: 'Path to the YAML file containing the case details',
    },
      checklistFilePath: {
        type: DataTypes.STRING,
        allowNull: true, // 나중에 필수로 변경 가능합니다.
        comment: 'Path to the YAML file for the evaluation checklist',
    },
  }, {
    sequelize,
    modelName: 'Scenario',
    tableName: 'Scenarios',
    timestamps: true,
  });

  return Scenario;
};
