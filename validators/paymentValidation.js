const { body } = require("express-validator");

exports.validatePayment = [
  body("paymentMethod")
    .isIn(["credit_card", "bank_transfer", "cash_on_delivery"])
    .withMessage("Geçerli bir ödeme yöntemi seçiniz."),
  body("paymentCard").if(
    (value, { req }) => req.body.paymentMethod === "credit_card",
  ),
  body("paymentCard.cardHolderName")
    .notEmpty()
    .withMessage("Kart sahibi adı boş bırakılamaz.")
    .isLength({ min: 3 })
    .withMessage("Kart sahibi adı en az 3 karakter olmalıdır."),
  body("paymentCard.cardNumber")
    .isCreditCard()
    .withMessage("Geçerli bir kart numarası giriniz."),
  body("paymentCard.expireMonth")
    .isInt({ min: 1, max: 12 })
    .withMessage("Geçerli bir son kullanma ayı giriniz (1-12)."),
  body("paymentCard.expireYear")
    .isInt({ min: new Date().getFullYear() })
    .withMessage("Geçerli bir son kullanma yılı giriniz."),
  body("paymentCard.cvc")
    .isLength({ min: 3, max: 4 })
    .withMessage("Geçerli bir CVC kodu giriniz.")
    .isNumeric()
    .withMessage("CVC kodu sadece rakamlardan oluşmalıdır."),
  body("identityNumber")
    .notEmpty()
    .withMessage("Kimlik numarası boş bırakılamaz.")
    .isLength({ min: 11, max: 11 })
    .withMessage("Geçerli bir kimlik numarası giriniz.")
    .isNumeric()
    .withMessage("Kimlik numarası sadece rakamlardan oluşmalıdır."),
];
