const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const reviewController = require("../controllers/reviewController");

router.get("/",reviewController.getAllReviews);
router.post("/",authMiddleware,reviewController.createReview);
router.put("/update/:id", authMiddleware, reviewController.updateReview);
router.delete("/delete/:id",authMiddleware,reviewController.deleteReview);

module.exports = router;