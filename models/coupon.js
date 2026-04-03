"use strict";

module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define(
    "Coupon",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      discount_amount: { type: DataTypes.INTEGER, allowNull: false },
      discount_type: { type: DataTypes.STRING, allowNull: false },
      expiry_date: { type: DataTypes.DATE, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      usage_limit: { type: DataTypes.INTEGER, allowNull: true },
      used_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      min_purchase_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    },
    {
      tableName: "Coupons",
      timestamps: false,
      freezeTableName: true,
    }
  );

  Coupon.associate = (models) => {
    Coupon.hasMany(models.Order, { foreignKey: "coupon_id", as: "orders" });
  };

  return Coupon;
};