"use strict";

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    "Address",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      district: { type: DataTypes.STRING, allowNull: false },
      address_detail: { type: DataTypes.TEXT, allowNull: false },
      is_default: { type: DataTypes.BOOLEAN, allowNull: false },
    },
    {
      tableName: "Addresses",
      timestamps: false,
      freezeTableName: true,
    }
  );

  Address.associate = (models) => {
    Address.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Address.hasMany(models.Order, { foreignKey: "address_id", as: "orders" });
  };

  return Address;
};