"use strict";

module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define(
    "CartItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      cart_id: { type: DataTypes.INTEGER, allowNull: false },
      variant_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    {
      tableName: "Cart_Items",
      timestamps: false,
    }
  );

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.ShoppingCart, { foreignKey: "cart_id", as: "cart" });
    CartItem.belongsTo(models.ProductVariant, { foreignKey: "variant_id", as: "variant" });
  };

  return CartItem;
};