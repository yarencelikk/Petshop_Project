"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chat_sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "ai",
      },
      topic: { type: Sequelize.STRING, allowNull: true },
      order_id: { type: Sequelize.INTEGER, allowNull: true },
      assigned_agent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable("messages", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      text: { type: Sequelize.TEXT, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "chat_sessions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sender_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "customer",
      },
      sender_id: { type: Sequelize.INTEGER, allowNull: true },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("messages");
    await queryInterface.dropTable("chat_sessions");
  },
};
