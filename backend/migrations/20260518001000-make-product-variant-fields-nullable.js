"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("ProductVariants", "variant_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("ProductVariants", "price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.changeColumn("ProductVariants", "stock", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn("ProductVariants", "sku", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("ProductVariants", "variant_name", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn("ProductVariants", "price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
    await queryInterface.changeColumn("ProductVariants", "stock", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn("ProductVariants", "sku", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
