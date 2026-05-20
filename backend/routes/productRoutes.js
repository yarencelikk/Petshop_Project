const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const productController = require("../controllers/productController");

const productImageUpload = upload.fields([
  { name: "product_image", maxCount: 10 },
  { name: "product_images", maxCount: 10 },
  { name: "product_images[]", maxCount: 10 },
]);

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  productImageUpload,
  productController.createProduct,
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productImageUpload,
  productController.updateProduct,
);
router.put(
  "/variant/:id",
  authMiddleware,
  adminMiddleware,
  productController.updateVariant,
);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct,
);

module.exports = router;
