const { Order, Payment, ShoppingCart, sequelize } = require("../models");

exports.processPayment = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { order_id, paymentMethod } = req.body;
    const order = await Order.findByPk(order_id, { transaction: t });
    if (!order) throw new Error("Sipariş bulunamadı.");
    if (order.status !== "pending")
      throw new Error("Bu siparişin ödemesi zaten yapılmış.");

    const isPaymentSuccessful = true;

    if (isPaymentSuccessful) {
      await Payment.create(
        {
          order_id: order.id,
          payment_method: paymentMethod || "credit_card",
          status: "success",
          transaction_id: "TXN" + Date.now(),
        },
        { transaction: t },
      );
      order.status = "paid";
      await order.save({ transaction: t });
      await ShoppingCart.destroy({
        where: { user_id: req.user.id },
        transaction: t,
      });

      await t.commit();
      res.json({
        success: 1,
        data: {order,  transactionId: "TXN" + Date.now(),},
        message: "Ödeme başarıyla kaydedildi ve sipariş onaylandı.",
      });
    } else {
      throw new Error("Ödeme işlemi başarısız oldu.");
    }
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

exports.getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = [
      { id: "credit_card", name: "Kredi Kartı" },
      { id: "bank_transfer", name: "Banka Havalesi" },
      { id: "cash_on_delivery", name: "Kapıda Ödeme" },
    ];

    res.json({
      success: 1,
      data: paymentMethods,
      message: "Ödeme yöntemleri listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const orderWhereCondition =
      req.user.role === "admin" ? {} : { user_id: req.user.id };
    const payments = await Payment.findAll({
      include: [
        {
          model: Order,
          as: "order",
          where:  orderWhereCondition ,
          attributes: ["id", "total_price", "status","user_id"],
        },
      ],
      order: [["id", "DESC"]]
    });

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Henüz bir ödeme kaydınız bulunmuyor.",
      });
    }
    res.json({
      success: 1,
      data: payments,
      message: "Ödeme geçmişi başarıyla listelendi.",
    });
  } catch (err) {
    next(err);
  }
};
