const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const userController = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { register, login } = require("../validators/userValidation");

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

router.post("/register", register, validate, userController.register);
router.post("/login", login, validate, userController.login);
router.get("/profile", authMiddleware, userController.getMyProfile);
router.put(
  "/update_profile",
  authMiddleware,
  upload.single("profile_image"),
  userController.updateProfile,
);
router.patch("/change-password", authMiddleware, userController.changePassword);
router.get("/all", authMiddleware, adminMiddleware, userController.getAllUsers);
router.get(
  "/detail/:id",
  authMiddleware,
  adminMiddleware,
  userController.getUserById,
);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  userController.deleteUser,
);

module.exports = router;
