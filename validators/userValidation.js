const { body } = require("express-validator");

// Telefon Regex: Türkiye formatı (5xx1234567 veya 05xx...)
const phoneRegex = /^(05|5)[0-9][0-9][1-9]([0-9]){6}$/;

// Şifre Regex: En az 6 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;

const userValidation = {
  register: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("İsim alanı boş bırakılamaz."),
    body("surname")
      .trim()
      .notEmpty()
      .withMessage("Soyisim alanı boş bırakılamaz."),
    body("email")
      .isEmail()
      .withMessage("Geçerli bir e-posta adresi giriniz.")
      .normalizeEmail(),

    body("phone_number")
      .matches(phoneRegex)
      .withMessage(
        "Geçerli bir telefon numarası giriniz (Örn: 5xx 123 45 67).",
      ),

    body("password")
      .matches(passwordRegex)
      .withMessage(
        "Şifre en az 6 karakter olmalı, en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.",
      ),
  ],

  login: [
    body("email").isEmail().withMessage("Geçerli bir e-posta adresi giriniz."),
    body("password").notEmpty().withMessage("Şifre gereklidir."),
  ],
};

module.exports = userValidation;
