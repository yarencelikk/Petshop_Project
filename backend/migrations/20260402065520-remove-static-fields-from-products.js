'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'price');
    await queryInterface.removeColumn('Products', 'stock');
    await queryInterface.removeColumn('Products', 'stock_type');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Products', 'price', { type: Sequelize.DECIMAL(10, 2) });
    await queryInterface.addColumn('Products', 'stock', { type: Sequelize.INTEGER });
    await queryInterface.addColumn('Products', 'stock_type', { type: Sequelize.STRING });
  }
};