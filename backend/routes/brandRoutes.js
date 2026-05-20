const express = require("express");
const router =express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware=require("../middlewares/adminMiddleware");
const brandController= require("../controllers/brandController");

router.get("/",brandController.getAllBrand);
router.post("/",authMiddleware,adminMiddleware,brandController.createBrand);
router.put("/:id",authMiddleware,adminMiddleware,brandController.updateBrand);
router.delete("/:id",authMiddleware,adminMiddleware,brandController.deleteBrand);

module.exports = router;