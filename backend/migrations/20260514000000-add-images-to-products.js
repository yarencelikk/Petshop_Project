'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'images', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.sequelize.query(`
      UPDATE "Products"
      SET "images" = jsonb_build_array("image")
      WHERE "image" IS NOT NULL
        AND ("images" IS NULL OR "images" = '[]'::jsonb)
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Products', 'images');
  }
};
