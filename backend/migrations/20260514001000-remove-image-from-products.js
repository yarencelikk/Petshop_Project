'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('Products', 'image');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'image', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE "Products"
      SET "image" = "images"->>0
      WHERE "images" IS NOT NULL
        AND jsonb_array_length("images") > 0
    `);
  }
};
