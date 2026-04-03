"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
      ProductVariant.hasMany(models.OrderItem, {
        foreignKey: "variant_id",
        as: "orderItems",
      });
      ProductVariant.hasMany(models.ShoppingCart, {
        foreignKey: "variant_id",
        as: "cartItems",
      });
    }
  }
  ProductVariant.init(
    {
      product_id: DataTypes.INTEGER,
      variant_name: DataTypes.STRING,
      price: DataTypes.DECIMAL(10, 2),
      stock: DataTypes.INTEGER,
      sku: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ProductVariant",
    },
  );
  return ProductVariant;
};
