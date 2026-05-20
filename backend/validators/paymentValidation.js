const { body } = require("express-validator");

const isCardPaymentMethod = (value) => {
  return ["credit_card", "bank_transfer"].includes(value);
};

exports.validatePayment = [
  body("paymentMethod")
    .isIn(["credit_card", "bank_transfer", "cash_on_delivery"])
    .withMessage("Geçerli bir ödeme yöntemi seçiniz."),

  body("paymentCard.cardHolderName")
    .if(body("paymentMethod").custom(isCardPaymentMethod))
    .notEmpty()
    .withMessage("Kart sahibi adı boş bırakılamaz.")
    .isLength({ min: 3 })
    .withMessage("Kart sahibi adı en az 3 karakter olmalıdır."),

  body("paymentCard.cardNumber")
    .if(body("paymentMethod").custom(isCardPaymentMethod))
    .customSanitizer((value) => String(value || "").replace(/\D/g, ""))
    .isLength({ min: 13, max: 19 })
    .withMessage("Kart numarası 13-19 haneli olmalıdır.")
    .isNumeric()
    .withMessage("Kart numarası sadece rakamlardan oluşmalıdır."),

  body("paymentCard.expireMonth")
    .if(body("paymentMethod").custom(isCardPaymentMethod))
    .customSanitizer((value) => String(value || "").replace(/\D/g, ""))
    .isInt({ min: 1, max: 12 })
    .withMessage("Geçerli bir son kullanma ayı giriniz (1-12)."),

  body("paymentCard.expireYear")
    .if(body("paymentMethod").custom(isCardPaymentMethod))
    .customSanitizer((value) => String(value || "").replace(/\D/g, ""))
    .isInt({ min: new Date().getFullYear() })
    .withMessage("Geçerli bir son kullanma yılı giriniz."),

  body("paymentCard.cvc")
    .if(body("paymentMethod").custom(isCardPaymentMethod))
    .customSanitizer((value) => String(value || "").replace(/\D/g, ""))
    .isLength({ min: 3, max: 4 })
    .withMessage("Geçerli bir CVC kodu giriniz.")
    .isNumeric()
    .withMessage("CVC kodu sadece rakamlardan oluşmalıdır."),

  body("identityNumber")
    .if(body("paymentMethod").custom(isCardPaymentMethod))
    .customSanitizer((value) => String(value || "").replace(/\D/g, ""))
    .notEmpty()
    .withMessage("Kimlik numarası boş bırakılamaz.")
    .isLength({ min: 11, max: 11 })
    .withMessage("Geçerli bir kimlik numarası giriniz.")
    .isNumeric()
    .withMessage("Kimlik numarası sadece rakamlardan oluşmalıdır."),
];
