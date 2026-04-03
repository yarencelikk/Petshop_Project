const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const shoppingCartController = require("../controllers/shoppingCartController");

router.get("/",authMiddleware,shoppingCartController.getCart);
router.post("/",authMiddleware, shoppingCartController.addToCart);
router.delete("/remove/:variant_id", authMiddleware, shoppingCartController.removeFromCart);
router.delete("/clear", authMiddleware, shoppingCartController.clearCart);

module.exports = router;