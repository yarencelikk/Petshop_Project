const { body } = require('express-validator');

const couponValidation = {
  create: [
    body('code')
      .trim()
      .notEmpty().withMessage('Kupon kodu boş olamaz.')
      .isLength({ min: 3 }).withMessage('Kupon kodu en az 3 karakter olmalı.'),
    body('discount_amount')
      .isFloat({ min: 1 }).withMessage('İndirim tutarı en az 1 olmalıdır.'),
    body('discount_type')
      .isIn(['percentage', 'fixed']).withMessage('İndirim türü ya "percentage" ya da "fixed" olmalıdır.'),
    body('expiry_date')
      .isISO8601().withMessage('Geçerli bir tarih formatı giriniz.'),
  ]
};

module.exports = couponValidation;