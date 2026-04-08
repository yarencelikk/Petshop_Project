const {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  sequelize,
} = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");

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
    return res.json({
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
    return res.json({
      success: 1,
      data: order,
      message: "Sipariş detayları başarıyla getirildi.",
    });
  } catch (err) {
    next(err);
  }
};

//Update
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: 0,
        data: null,
        message: "Bu siparişi güncelleme yetkiniz yok.",
      });
    }
    const allowedStatuses = ["preparing", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: 0,
        data: null,
        data: null,
        message: `Geçersiz statü. Admin sadece şu durumları güncelleyebilir: ${allowedStatuses.join(", ")}`,
      });
    }
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Sipariş bulunamadı.",
      });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({
        success: 0,
        message: "İptal edilmiş bir siparişin durumu değiştirilemez.",
      });
    }

    order.status = status;
    await order.save();
    return res.json({
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
      return res.status(400).json({
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
    return res.json({
      success: 1,
      data: order,
      message: `Sipariş #${order.id} iptal edildi ve stoklar varyasyon bazlı güncellendi.`,
    });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};
