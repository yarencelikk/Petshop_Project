"use strict";

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: "Categories",
      timestamps: false,
      freezeTableName: true,
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: "category_id", as: "products" });
  };

  return Category;
};