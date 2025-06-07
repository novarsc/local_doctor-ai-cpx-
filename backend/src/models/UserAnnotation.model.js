/**
 * @file UserAnnotation.model.js
 * @description Defines the Sequelize model for user annotations on learning materials.
 */
'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class UserAnnotation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // UserAnnotation은 User 모델에 속합니다.
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      // UserAnnotation은 LearningMaterial 모델에 속합니다.
      this.belongsTo(models.LearningMaterial, {
        foreignKey: 'learningMaterialId',
        onDelete: 'CASCADE',
      });
    }
  }

  UserAnnotation.init({
    annotationId: {
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
    learningMaterialId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'LearningMaterials',
        key: 'learningMaterialId',
      },
    },
    type: {
      type: DataTypes.ENUM('HIGHLIGHT', 'MEMO', 'BOOKMARK'),
      allowNull: false,
      // [변경됨] 복잡한 SQL 생성을 피하기 위해 주석(comment)을 제거합니다.
      // comment: 'Type of the annotation (e.g., highlight, memo, bookmark)',
    },
    locationData: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'JSON object describing the location of the annotation (e.g., character offset, DOM path)',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true, // 하이라이트나 북마크는 별도 내용이 없을 수 있습니다.
      comment: 'Content of the annotation, e.g., the text of a memo',
    },
  }, {
    sequelize,
    modelName: 'UserAnnotation',
    tableName: 'UserAnnotations',
    timestamps: true,
  });

  return UserAnnotation;
};
