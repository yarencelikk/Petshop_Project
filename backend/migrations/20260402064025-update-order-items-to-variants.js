"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("OrderItems");

    if (tableInfo.product_id) {
      await queryInterface.removeColumn("OrderItems", "product_id");
    }

    if (!tableInfo.variant_id) {
      await queryInterface.addColumn("OrderItems", "variant_id", {
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

    await queryInterface.bulkDelete("OrderItems", null, {});

    await queryInterface.changeColumn("OrderItems", "variant_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("OrderItems", "product_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.removeColumn("OrderItems", "variant_id");
  },
};
