"use strict";

module.exports = (sequelize, DataTypes) => {
  const ShoppingCart = sequelize.define(
    "ShoppingCart",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      variant_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "Shopping_Carts",
      timestamps: false,
      freezeTableName: true,
    }
  );

  ShoppingCart.associate = (models) => {
    ShoppingCart.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    ShoppingCart.belongsTo(models.ProductVariant, { 
    foreignKey: "variant_id", 
    as: "variants" 
  });
  };

  return ShoppingCart;
};