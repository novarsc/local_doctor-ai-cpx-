'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename); // 현재 파일 이름 'index.js'를 가져옵니다.
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/db.config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    // 이 필터 부분이 핵심입니다.
    // 1. 숨김 파일이 아니고 ('.'으로 시작하지 않고)
    // 2. 현재 파일(index.js)이 아니며
    // 3. 자바스크립트 파일(.js)이고
    // 4. 테스트 파일이 아님
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // [디버깅] 어떤 모델 파일을 불러오는지 확인하기 위해 추가
    console.log(`[Sequelize] Loading model: ${file}`);
    
    // 올바르게 수정된 Sequelize v6 이후의 모델 import 방식입니다.
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
