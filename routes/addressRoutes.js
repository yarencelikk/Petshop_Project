const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const addressController = require("../controllers/addressController");

router.get("/", authMiddleware, addressController.getAddress);
router.post("/", authMiddleware, addressController.createAddress);
router.put("/:id", authMiddleware, addressController.updateAddress);
router.delete("/:id", authMiddleware, addressController.deleteAddress);

module.exports = router;
