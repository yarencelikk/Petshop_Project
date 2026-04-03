'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.hasMany(models.ProductVariant, {
        foreignKey: 'product_id',
        as: 'variants',
        onDelete: 'CASCADE'
      });
      Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
      Product.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'brand' });
    }
  }

  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category_id: DataTypes.INTEGER,
    brand_id: DataTypes.INTEGER,
    pet_type_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Product',
    timestamps: false,
  });

  return Product;
};