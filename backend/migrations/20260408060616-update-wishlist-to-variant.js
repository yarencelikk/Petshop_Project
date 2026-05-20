'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.removeColumn('Wishlists', 'product_id');

    await queryInterface.addColumn('Wishlists', 'variant_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'ProductVariants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Wishlists', 'variant_id');
    await queryInterface.addColumn('Wishlists', 'product_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};