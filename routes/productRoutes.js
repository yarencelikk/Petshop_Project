const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload =require("../middlewares/uploadMiddleware");
const productController = require("../controllers/productController");

router.get("/",productController.getAllProducts);
router.post("/",authMiddleware,adminMiddleware,upload.single("product_image"),productController.createProduct);
router.put("/:id",authMiddleware,adminMiddleware,upload.single("product_image"),productController.updateProduct);
router.put("/variant/:id",authMiddleware,adminMiddleware,productController.updateVariant);
router.delete("/:id",authMiddleware,adminMiddleware,productController.deleteProduct);

module.exports = router;
