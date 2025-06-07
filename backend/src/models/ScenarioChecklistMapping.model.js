/**
 * @file ScenarioChecklistMapping.model.js
 * @description Defines the join table between Scenarios and ChecklistItems (Many-to-Many).
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class ScenarioChecklistMapping extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 이 모델은 중간 테이블이므로 다른 모델과 직접적인 관계 설정은
      // 각 원본 모델(Scenario, ChecklistItem)의 belongsToMany에서 처리됩니다.
    }
  }

  ScenarioChecklistMapping.init({
    mappingId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    scenarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Scenarios',
        key: 'scenarioId',
      },
      onDelete: 'CASCADE',
    },
    checklistItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ChecklistItems',
        key: 'checklistItemId',
      },
      onDelete: 'CASCADE',
    },
  }, {
    sequelize,
    modelName: 'ScenarioChecklistMapping',
    tableName: 'ScenarioChecklistMappings',
    timestamps: true,
  });

  return ScenarioChecklistMapping;
};
