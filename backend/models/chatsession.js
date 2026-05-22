"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatSession extends Model {
    static associate(models) {
      ChatSession.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      ChatSession.belongsTo(models.User, {
        foreignKey: "assignedAgentId",
        as: "assignedAgent",
      });
      ChatSession.hasMany(models.Message, {
        foreignKey: "sessionId",
        as: "messages",
      });
    }
  }

  ChatSession.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: "ai" },
      topic: { type: DataTypes.STRING, allowNull: true },
      orderId: { type: DataTypes.INTEGER, allowNull: true },
      assignedAgentId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "ChatSession",
      tableName: "chat_sessions",
      underscored: true,
    },
  );

  return ChatSession;
};
