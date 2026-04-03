const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const petTypeController = require("../controllers/petTypeController");

router.get("/", petTypeController.getAllPetType);
router.post("/", authMiddleware, adminMiddleware, petTypeController.createPetType);
router.put("/:id", authMiddleware, adminMiddleware, petTypeController.updatePetType);
router.delete("/:id", authMiddleware, adminMiddleware, petTypeController.deletePetType);

module.exports = router;