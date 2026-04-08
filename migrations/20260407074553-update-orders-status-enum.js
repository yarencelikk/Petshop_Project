'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_status" CASCADE;');
    await queryInterface.addColumn('Orders', 'status', {
      type: Sequelize.ENUM('pending', 'preparing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_status" CASCADE;');
    await queryInterface.changeColumn('Orders', 'status', {
      type: Sequelize.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    });
  }
};