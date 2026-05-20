'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Fazlalık kolonları siliyoruz
    await queryInterface.removeColumn('Shopping_Carts', 'variant_id');
    await queryInterface.removeColumn('Shopping_Carts', 'quantity');
    
    // 2. user_id alanını unique yapıyoruz (opsiyonel ama tavsiye edilir)
    await queryInterface.addConstraint('Shopping_Carts', {
      fields: ['user_id'],
      type: 'unique',
      name: 'unique_user_cart'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Geri almak gerekirse kolonları tekrar ekleriz
    await queryInterface.addColumn('Shopping_Carts', 'variant_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('Shopping_Carts', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};