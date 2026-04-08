const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);
router.get("/", wishlistController.getMyWishlist);
router.post("/", wishlistController.addToWishlist);
router.delete("/:variant_id", wishlistController.removeFromWishlist);

module.exports = router;