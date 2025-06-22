'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'socialProvider', {
      type: Sequelize.ENUM('naver', 'kakao', 'google'),
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'socialId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'resetPasswordToken', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'resetPasswordExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 기존 password 필드를 nullable로 변경
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 인덱스 추가
    await queryInterface.addIndex('Users', ['socialProvider', 'socialId']);
    await queryInterface.addIndex('Users', ['resetPasswordToken']);
  },

  down: async (queryInterface, Sequelize) => {
    // 인덱스 제거
    await queryInterface.removeIndex('Users', ['socialProvider', 'socialId']);
    await queryInterface.removeIndex('Users', ['resetPasswordToken']);

    // 컬럼 제거
    await queryInterface.removeColumn('Users', 'socialProvider');
    await queryInterface.removeColumn('Users', 'socialId');
    await queryInterface.removeColumn('Users', 'resetPasswordToken');
    await queryInterface.removeColumn('Users', 'resetPasswordExpires');

    // password 필드를 다시 not null로 변경
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // ENUM 타입 제거
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_socialProvider";');
  }
}; 