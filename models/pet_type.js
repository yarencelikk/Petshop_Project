"use strict";

module.exports = (sequelize, DataTypes) => {
  const PetType = sequelize.define(
    "PetType",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: "Pet_Types",
      timestamps: false,
      freezeTableName: true,
    }
  );

  PetType.associate = (models) => {
    PetType.hasMany(models.Product, { foreignKey: "pet_type_id", as: "products" });
  };

  return PetType;
};