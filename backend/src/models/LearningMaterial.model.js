/**
 * @file LearningMaterial.model.js
 * @description Defines the Sequelize model for learning materials associated with scenarios.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class LearningMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // LearningMaterial은 하나의 Scenario에 속합니다. (1:1 또는 1:N 관계 가능, 여기서는 1:1로 가정)
      this.belongsTo(models.Scenario, {
        foreignKey: 'scenarioId',
        onDelete: 'CASCADE',
      });
    }
  }

  LearningMaterial.init({
    learningMaterialId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for the learning material',
    },
    scenarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // 시나리오 하나당 학습 자료는 하나만 있다고 가정
      references: {
        model: 'Scenarios', // 'Scenarios' 테이블을 참조합니다.
        key: 'scenarioId',
      },
      comment: 'The scenario this material is associated with',
    },
    content: {
      type: DataTypes.TEXT('long'), // 매우 긴 텍스트를 저장할 수 있도록 'long' 옵션 추가
      allowNull: false,
      comment: 'The main content of the learning material (in Markdown, HTML, or JSON format)',
    },
    contentType: {
        type: DataTypes.ENUM('MARKDOWN', 'HTML', 'JSON'),
        allowNull: false,
        defaultValue: 'MARKDOWN',
        // [변경됨] 복잡한 SQL 생성을 피하기 위해 주석(comment)을 제거합니다.
        // comment: 'The format of the content field'
    }
  }, {
    sequelize,
    modelName: 'LearningMaterial',
    tableName: 'LearningMaterials',
    timestamps: true,
  });

  return LearningMaterial;
};
