const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const couponRoutes = require("./couponRoutes");
const orderRoutes = require("./orderRoutes");
const shoppingCartRoutes = require("./shoppingCartRoutes");
const wishlistRoutes = require("./wishlistRoutes");
const addressRoutes = require("./addressRoutes");
const brandRoutes = require("./brandRoutes");
const categoryRoutes = require("./categoryRoutes");
const petTypeRoutes = require("./petTypeRoutes");
const paymentRoutes = require("./paymentRoutes");
const reviewRoutes = require("./reviewsRoutes");


router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/coupons", couponRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", shoppingCartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/addresses", addressRoutes);
router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/pet-types", petTypeRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);

module.exports = router;
