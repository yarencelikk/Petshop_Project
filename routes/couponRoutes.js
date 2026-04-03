const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const couponController = require("../controllers/couponController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const couponValidation = require("../middlewares/couponValidationMiddleware");

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

router.post("/validate", authMiddleware, couponController.validateCoupon);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  couponValidation.create,
  validate,
  couponController.createCoupon,
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  couponController.getAvailableCoupons,
);

module.exports = router;
