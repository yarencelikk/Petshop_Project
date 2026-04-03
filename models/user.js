"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      phone_number: { type: DataTypes.STRING, allowNull: false },
      image: { type: DataTypes.STRING },
      role: { type: DataTypes.ENUM("user", "admin"), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "Users",
      timestamps: false,
      freezeTableName: true,
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Address, { foreignKey: "user_id", as: "addresses" });
    User.hasMany(models.Order, { foreignKey: "user_id", as: "orders" });
    User.hasMany(models.Wishlist, { foreignKey: "user_id", as: "wishlists" });
    User.hasMany(models.ShoppingCart, { foreignKey: "user_id", as: "cartItems" });
    User.hasMany(models.Review, { foreignKey: "user_id", as: "reviews" });
  };

  return User;
};