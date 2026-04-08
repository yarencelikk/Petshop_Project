"use strict";

module.exports = (sequelize, DataTypes) => {
  const ShoppingCart = sequelize.define(
    "ShoppingCart",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }, 
    },
    {
      tableName: "Shopping_Carts",
      timestamps: false,
      freezeTableName: true,
    }
  );

  ShoppingCart.associate = (models) => {
    ShoppingCart.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    ShoppingCart.hasMany(models.CartItem, {
      foreignKey: "cart_id",
      as: "items",
    });
  };

  return ShoppingCart;
};