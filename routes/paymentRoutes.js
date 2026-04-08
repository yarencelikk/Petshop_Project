const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware");
const paymentController = require("../controllers/paymentController");
const {validatePayment} = require("../validators/paymentValidation");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: 0,
      message: "Doğrulama hatası",
      errors: errors
        .array()
        .map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

router.get("/methods", authMiddleware, paymentController.getPaymentMethods);
router.post("/payment", authMiddleware, ...validatePayment, validate, paymentController.processPayment);
router.get(
  "/history", 
  authMiddleware,
  paymentController.getPaymentHistory
);
module.exports = router;