const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const paymentController = require("../controllers/paymentController");

router.get("/methods", authMiddleware, paymentController.getPaymentMethods);
router.post("/process", authMiddleware, paymentController.processPayment);
router.get(
  "/history", 
  authMiddleware,
  paymentController.getPaymentHistory
);
module.exports = router;