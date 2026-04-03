"use strict";

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      variant_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      price_at_purchase: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      tableName: "OrderItems",
      timestamps: false,
      freezeTableName: true,
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: "order_id", as: "order" });
    OrderItem.belongsTo(models.ProductVariant, { foreignKey: "variant_id", as: "variants" });
  };

  return OrderItem;
};