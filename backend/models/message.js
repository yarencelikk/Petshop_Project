"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Message.belongsTo(models.ChatSession, {
        foreignKey: "sessionId",
        as: "session",
      });
    }
  }

  Message.init(
    {
      text: { type: DataTypes.TEXT, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      sessionId: { type: DataTypes.INTEGER, allowNull: false },
      senderType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "customer",
      },
      senderId: { type: DataTypes.INTEGER, allowNull: true },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "Message",
      tableName: "messages",
      underscored: true,
    },
  );

  return Message;
};
