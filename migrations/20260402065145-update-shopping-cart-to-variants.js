"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("Shopping_Carts");

    if (tableInfo.product_id) {
      await queryInterface.removeColumn("Shopping_Carts", "product_id");
    }

    if (!tableInfo.variant_id) {
      await queryInterface.addColumn("Shopping_Carts", "variant_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "ProductVariants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }

    await queryInterface.bulkDelete("Shopping_Carts", null, {});

    await queryInterface.changeColumn("Shopping_Carts", "variant_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Shopping_Carts", "product_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.removeColumn("Shopping_Carts", "variant_id");
  },
};
