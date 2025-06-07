/**
 * @file ChecklistItem.model.js
 * @description Defines the Sequelize model for individual checklist items used in evaluations.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class ChecklistItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // ChecklistItem은 여러 Scenario와 다대다(N:M) 관계를 가집니다.
      // 중간 테이블인 ScenarioChecklistMapping을 통해 연결됩니다.
      this.belongsToMany(models.Scenario, {
        through: 'ScenarioChecklistMapping',
        foreignKey: 'checklistItemId',
        otherKey: 'scenarioId'
      });
    }
  }

  ChecklistItem.init({
    checklistItemId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the checklist item',
    },
    itemContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The content of the checklist item (e.g., "통증의 양상을 질문하였는가?")',
    },
    evaluationCriteria: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed guide on how to evaluate this item.',
    },
    primaryCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The main category of the checklist item (e.g., "병력 청취")',
    },
    secondaryCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The sub-category of the checklist item (e.g., "현병력")',
    },
  }, {
    sequelize,
    modelName: 'ChecklistItem',
    tableName: 'ChecklistItems',
    timestamps: true,
  });

  return ChecklistItem;
};
