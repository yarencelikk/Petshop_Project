'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_Payments_status" AS ENUM('pending', 'success', 'failed', 'refunded');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Payments" 
      ALTER COLUMN "status" TYPE "enum_Payments_status" 
      USING ("status"::"enum_Payments_status");
    `);

    await queryInterface.changeColumn('Payments', 'status', {
      type: Sequelize.ENUM('pending', 'success', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Payments', 'status', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Payments_status" CASCADE;');
  }
};