'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Payments', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    });

    await queryInterface.addColumn('Payments', 'raw_result', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Payments', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Payments', 'created_at');
    await queryInterface.removeColumn('Payments', 'raw_result');
    await queryInterface.removeColumn('Payments', 'amount');
  }
};