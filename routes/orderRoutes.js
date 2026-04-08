const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const orderController = require("../controllers/orderController");

router.get("/",authMiddleware,orderController.getOrders);
router.get("/:id",authMiddleware,orderController.getOrderById);
router.put("/status/:id",authMiddleware,adminMiddleware,orderController.updateOrderStatus);
router.put("/cancel/:id",authMiddleware,adminMiddleware,orderController.cancelOrder);

module.exports = router;