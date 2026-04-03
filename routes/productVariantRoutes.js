const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const productVariantController = require("../controllers/productVariantController");

router.get("/:product_id",authMiddleware,adminMiddleware, productVariantController.getVariantsByProduct);
router.post("/:product_id", authMiddleware, adminMiddleware, productVariantController.addVariant);
router.put("/:id", authMiddleware, adminMiddleware, productVariantController.updateVariant);
router.delete("/:variant_id", authMiddleware, adminMiddleware, productVariantController.deleteVariant);

module.exports = router;