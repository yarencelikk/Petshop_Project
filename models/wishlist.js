"use strict";

module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define(
    "Wishlist",
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      variant_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      user_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
    },
    {
      tableName: "Wishlists",
      timestamps: false,
      freezeTableName: true,
    }
  );

  Wishlist.associate = (models) => {
    Wishlist.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Wishlist.belongsTo(models.ProductVariant, { 
      foreignKey: "variant_id", 
      as: "variants" 
    });
  };

  return Wishlist;
};