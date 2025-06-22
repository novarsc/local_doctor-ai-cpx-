// File: backend/src/models/Scenario.model.js

const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class Scenario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        // 시나리오는 여러 실습 세션을 가질 수 있습니다 (1:N)
        this.hasMany(models.PracticeSession, {
            foreignKey: 'scenarioId',
            as: 'practiceSessions'
        });
        // 시나리오는 여러 사용자에게 북마크될 수 있습니다 (1:N)
        this.hasMany(models.UserBookmarkedScenario, {
            foreignKey: 'scenarioId',
            as: 'bookmarks'
        });
        // 시나리오는 여러 사용자의 실습 이력을 가질 수 있습니다 (1:N)
        this.hasMany(models.UserPracticeHistory, {
            foreignKey: 'scenarioId',
            as: 'practiceHistory'
        });
    }
  }

  Scenario.init({
    scenarioId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shortDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    primaryCategory: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    secondaryCategory: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    presentingComplaint: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bloodPressure: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pulse: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    respiration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    temperature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    defaultAiPersonalityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    keywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    caseFilePath: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    checklistFilePath: {
        type: DataTypes.STRING,
        allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Scenario',
    tableName: 'Scenarios',
    timestamps: true,
  });

  return Scenario;
};
