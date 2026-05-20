const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const emailController = require("../controllers/emailController");

router.post("/contact", emailController.sendContactEmail);

router.post(
  "/send",
  authMiddleware,
  adminMiddleware,
  emailController.sendAdminEmail,
);

module.exports = router;
