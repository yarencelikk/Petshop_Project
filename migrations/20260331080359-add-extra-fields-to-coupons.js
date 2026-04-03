'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Coupons', 'usage_limit', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn('Coupons', 'used_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Coupons', 'min_purchase_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Coupons', 'usage_limit');
    await queryInterface.removeColumn('Coupons', 'used_count');
    await queryInterface.removeColumn('Coupons', 'min_purchase_amount');
  }
};