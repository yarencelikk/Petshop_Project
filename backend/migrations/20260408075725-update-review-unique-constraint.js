'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Reviews', 'unique_review_user_product');

    await queryInterface.addConstraint('Reviews', {
      fields: ['user_id', 'variant_id', 'order_id'],
      type: 'unique',
      name: 'unique_review_user_variant_order'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Reviews', 'unique_review_user_variant_order');
    await queryInterface.addConstraint('Reviews', {
      fields: ['user_id', 'product_id'],
      type: 'unique',
      name: 'unique_review_user_product'
    });
  }
};