"use strict";

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      coupon_id: { type: DataTypes.INTEGER },
      total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "paid", "shipped", "delivered", "cancelled"),
        allowNull: false,
      },
      address_id: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "Orders",
      timestamps: false,
      freezeTableName: true,
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Order.belongsTo(models.Coupon, { foreignKey: "coupon_id", as: "coupon" });
    Order.belongsTo(models.Address, { foreignKey: "address_id", as: "address" });

    Order.hasMany(models.OrderItem, { foreignKey: "order_id", as: "orderItems" });
    Order.hasOne(models.Payment, { foreignKey: "order_id", as: "payment" });
  };

  return Order;
};