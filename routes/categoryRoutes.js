const express = require("express");
const router =express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware=require("../middlewares/adminMiddleware");
const categoryController= require("../controllers/categoryController");

router.get("/",authMiddleware,categoryController.getAllCategory);
router.post("/",authMiddleware,adminMiddleware,categoryController.createCategory);
router.put("/:id",authMiddleware,adminMiddleware,categoryController.updateCategory);
router.delete("/:id",authMiddleware,adminMiddleware,categoryController.deleteCategory);

module.exports = router;