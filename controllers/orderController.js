const {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Coupon,
  sequelize,
} = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");
const { Op } = require("sequelize");

//read
exports.getOrders = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page,
    );
    const whereCondition =
      req.user.role !== "admin" ? { user_id: req.user.id } : {};

    const { count, rows: orders } = await Order.findAndCountAll({
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: ProductVariant,
              as: "variants",
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["name", "image"],
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
      where: whereCondition,
      order: [["created_at", "DESC"]],
    });
    res.json({
      success: 1,
      data: { orders, pagination: getPagingData(count, req.query.page, limit) },
      message: "Siparişler listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const current_user_id = req.user.id;
    const is_admin = req.user.role === "admin";

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: ProductVariant,
              as: "variants",
              attributes: ["id", "variant_name", "sku"],
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["name", "image"],
                },
              ],
            },
          ],
        },
      ],
    });
    if (!order) {
      return res
        .status(404)
        .json({ success: 0, message: "Sipariş bulunamadı." });
    }
    if (!is_admin && order.user_id !== current_user_id) {
      return res.status(403).json({
        success: 0,
        data: null,
        message: "Bu sipariş detaylarını görüntüleme yetkiniz yok.",
      });
    }
    res.json({
      success: 1,
      data: order,
      message: "Sipariş detayları başarıyla getirildi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { items, address_id, coupon_code } = req.body;
    let total_price = 0;
    const orderItemsData = [];

    for (const item of items) {
      const variant = await ProductVariant.findByPk(item.variant_id, {
        include: [{ model: Product, as: "product" }],
        transaction: t,
      });

      if (!variant)
        throw new Error(`${item.variant_id} ID'li ürün seçeneği bulunamadı.`);

      if (variant.stock < item.quantity) {
        throw new Error(
          `${variant.product.name} (${variant.variant_name}) için yeterli stok yok. Mevcut: ${variant.stock}`,
        );
      }

      const itemPrice = parseFloat(variant.price);
      total_price += itemPrice * item.quantity;

      orderItemsData.push({
        variant_id: variant.id,
        quantity: item.quantity,
        price_at_purchase: itemPrice,
      });

      variant.stock -= item.quantity;
      await variant.save({ transaction: t });
    }

    let discount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      appliedCoupon = await Coupon.findOne({
        where: {
          code: coupon_code.toUpperCase(),
          is_active: true,
          expiry_date: { [Op.gt]: new Date() },
          [Op.or]: [
            { usage_limit: null },
            { usage_limit: { [Op.gt]: sequelize.col("used_count") } },
          ],
        },
        transaction: t,
      });
      if (
        appliedCoupon &&
        total_price >= parseFloat(appliedCoupon.min_purchase_amount)
      ) {
        discount =
          appliedCoupon.discount_type === "fixed"
            ? appliedCoupon.discount_amount
            : (total_price * appliedCoupon.discount_amount) / 100;

        await appliedCoupon.increment("used_count", { by: 1, transaction: t });
      }
    }

    const final_price = Math.max(0, total_price - discount);

    const newOrder = await Order.create(
      {
        user_id: req.user.id,
        address_id,
        total_price: final_price,
        status: "pending",
        coupon_id: appliedCoupon ? appliedCoupon.id : null,
        created_at: new Date(),
      },
      { transaction: t },
    );

    const finalItems = orderItemsData.map((item) => ({
      ...item,
      order_id: newOrder.id,
    }));
    await OrderItem.bulkCreate(finalItems, { transaction: t });

    await t.commit();
    res.status(201).json({
      success: 1,
      data: newOrder,
      message: "Siparişiniz başarıyla oluşturuldu.",
    });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

//Update
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: 0, dat: null, message: "Sipariş bulunamadı." });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: 0,
        data: null,
        message: "Bu siparişi güncelleme yetkiniz yok.",
      });
    }
    order.status = status;
    await order.save();

    res.json({
      success: 1,
      data: order,
      message: `Sipariş durumu '${status}' olarak güncellendi.`,
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: "orderItems" }],
      transaction: t,
    });

    if (!order)
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Sipariş bulunamadı." });
    if (order.status === "cancelled")
      return res
        .status(400)
        .json({ success: 0, data: null, message: "Zaten iptal edilmiş." });
    if (["shipped", "delivered"].includes(order.status)) {
      return res
        .status(400)
        .json({
          success: 0,
          data: null,
          message: "Kargolanan sipariş iptal edilemez.",
        });
    }
    for (const item of order.orderItems) {
      const variant = await ProductVariant.findByPk(item.variant_id, {
        transaction: t,
      });
      if (variant) {
        variant.stock += item.quantity;
        await variant.save({ transaction: t });
      }
    }

    order.status = "cancelled";
    await order.save({ transaction: t });

    await t.commit();
    res.json({
      success: 1,
      data: order,
      message: `Sipariş #${order.id} iptal edildi ve stoklar varyasyon bazlı güncellendi.`,
    });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};
