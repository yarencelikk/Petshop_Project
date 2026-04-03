const {
  Order,
  Payment,
  ShoppingCart,
  OrderItem,
  ProductVariant,
  Product,
  User,
  Address,
  sequelize,
} = require("../models");
const { createPayment } = require("../services/iyzicoService");
const logger = require("../utils/logger");

exports.processPayment = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { order_id, paymentCard, paymentMethod,identityNumber } = req.body;
    const order = await Order.findByPk(order_id, {
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: ProductVariant,
              as: "variants",
              include: [{ model: Product, as: "product" }],
            },
          ],
        },
        { model: User, as: "user" },
        { model: Address, as: "address" },
      ],
      transaction: t,
    });
    if (!order) throw new Error("Sipariş bulunamadı.");
    if (order.status !== "pending")
      throw new Error("Bu siparişin ödemesi zaten yapılmış.");
    const shippingAddress = {
      contactName: `${order.user.name} ${order.user.surname}`,
      city: order.address.city,
      country: "Turkey",
      address: `${order.address.district} - ${order.address.address_detail}`,
    };
    const basketItems = order.orderItems.map((item) => ({
      id: item.variant_id.toString(),
      name: item.variants?.product?.name || "Pet Ürünü",
      price: (item.price_at_purchase * item.quantity).toString(),
      category1: "Pet Shop",
      itemType: "PHYSICAL",
    }));
    const billingAddress = shippingAddress;
    const iyzicoData = {
      locale: "tr",
      conversationId: order_id.toString(),
      price: order.total_price.toString(),
      paidPrice: order.total_price.toString(),
      currency: "TRY",
      installment: "1",
      basketId: order_id.toString(),
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      paymentCard: paymentCard,
      buyer: {
        id: order.user.id.toString(),
        name: order.user.name,
        surname: order.user.surname,
        email: order.user.email,
        city: order.address.city,
        country: "Turkey",
        identityNumber: identityNumber || "11111111111",
        registrationAddress: `${order.address.district} ${order.address.address_detail}`
      },
      shippingAddress: shippingAddress,
      billingAddress: billingAddress,
      basketItems: basketItems,
    };

    logger.info(`Iyzico ödeme isteği başlatıldı. Sipariş ID: ${order.id}`);
    const result = await createPayment(iyzicoData);

    if (result.status === "success") {
      await Payment.create(
        {
          order_id: order.id,
          payment_method: paymentMethod || "credit_card",
          status: "success",
          transaction_id: result.paymentId,
          amount: order.total_price,
          raw_result: JSON.stringify(result),
          created_at: new Date(),
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
      logger.info(
        `Ödeme başarıyla tamamlandı. TransactionID: ${result.paymentId}`,
      );
      res.json({
        success: 1,
        data: { order, transactionId: result.paymentId },
        message: "Ödeme başarıyla kaydedildi ve sipariş onaylandı.",
      });
    } else {
      logger.warn(`Ödeme başarısız: ${result.errorMessage}`);
      throw new Error(
        result.errorMessage || "Ödeme işlemi banka tarafından reddedildi.",
      );
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
          where: orderWhereCondition,
          attributes: ["id", "total_price", "status", "user_id"],
        },
      ],
      order: [["id", "DESC"]],
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
