"use strict";

module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define(
    "Brand",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: "Brands",
      timestamps: false,
      freezeTableName: true,
    }
  );

  Brand.associate = (models) => {
    Brand.hasMany(models.Product, { foreignKey: "brand_id", as: "products" });
  };

  return Brand;
};