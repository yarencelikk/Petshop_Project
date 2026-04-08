const { Coupon } = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");
const { Op } = require("sequelize");

exports.getAvailableCoupons = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page,
    );
    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: {
        is_active: true,
        expiry_date: { [Op.gt]: new Date() },
        [Op.or]: [
          { usage_limit: null },
          { usage_limit: { [Op.gt]: Coupon.sequelize.col("used_count") } },
        ],
      },
      limit,
      offset,
      order: [["expiry_date", "ASC"]],
    });

    if (!coupons || coupons.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Aktif kupon bulunamadı." });
    }

    return res.json({
      success: 1,
      data: {
        coupons,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: "Aktif kuponlar listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discount_amount,
      discount_type,
      expiry_date,
      is_active,
      usage_limit,
      min_purchase_amount,
    } = req.body;

    const existing = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      return res
        .status(400)
        .json({
          success: 0,
          data: null,
          message: "Bu kupon kodu zaten mevcut.",
        });
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      discount_amount,
      discount_type,
      expiry_date:
        expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_active: is_active !== undefined ? is_active : true,
      usage_limit: usage_limit || null,
      min_purchase_amount: min_purchase_amount || 0,
      used_count: 0,
    });

    return res.status(201).json({
      success: 1,
      data: newCoupon,
      message: "Kupon başarıyla oluşturuldu.",
    });
  } catch (err) {
    next(err);
  }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ success: 0, data: null, message: "Kupon kodu gerekli." });
    }

    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        expiry_date: { [Op.gt]: new Date() },
      },
    });
    if (!coupon) {
      return res
        .status(404)
        .json({
          success: 0,
          data: null,
          message: "Geçersiz veya süresi dolmuş kupon.",
        });
    }
    if (
      coupon.usage_limit !== null &&
      coupon.used_count >= coupon.usage_limit
    ) {
      return res
        .status(400)
        .json({
          success: 0,
          data: null,
          message: "Bu kuponun kullanım limiti dolmuştur.",
        });
    }
    if (cartTotal < parseFloat(coupon.min_purchase_amount)) {
      return res.status(400).json({
        success: 0,
        data: null,
        message: `Bu kuponu kullanmak için sepet tutarı en az ${coupon.min_purchase_amount} TL olmalıdır.`,
      });
    }

    return res.json({
      success: 1,
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_amount: coupon.discount_amount,
        discount_type: coupon.discount_type,
      },
      message: "Kupon başarıyla uygulandı.",
    });
  } catch (err) {
    next(err);
  }
};
