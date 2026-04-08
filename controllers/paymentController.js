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
  Coupon,
  CartItem,
} = require("../models");
const { Op } = require("sequelize");
const { createPayment } = require("../services/iyzicoService");
const logger = require("../utils/logger");

exports.processPayment = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { coupon_code, paymentCard, paymentMethod } = req.body;
    const userId = req.user.id;

    const cart = await ShoppingCart.findOne({
      where: { user_id: userId },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [
            {
              model: ProductVariant,
              as: "variant",
              include: [{ model: Product, as: "product" }],
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Sepetiniz boş. Ödeme başlatılamaz.");
    }

    let total_price = 0;
    const orderItemsData = [];

    for (const cartItem of cart.items) {
      const variant = cartItem.variant;
      if (!variant) throw new Error("Ürün varyantı bulunamadı.");
      if (variant.stock < cartItem.quantity)
        throw new Error(`${variant.product.name} için stok yetersiz.`);

      const itemPrice = parseFloat(variant.price);
      const subTotal = itemPrice * cartItem.quantity;
      total_price += subTotal;

      orderItemsData.push({
        variant_id: variant.id,
        quantity: cartItem.quantity,
        price_at_purchase: itemPrice,
      });

      variant.stock -= cartItem.quantity;
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
        },
        [Op.or]: [
          { usage_limit: null },
          { usage_limit: { [Op.gt]: sequelize.col("used_count") } },
        ],
        transaction: t,
      });
      if (!appliedCoupon) {
        throw new Error(
          "Girdiğiniz kupon kodu geçersiz, süresi dolmuş veya kullanım sınırına ulaşmış.",
        );
      }
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
    const basketItemsForIyzico = [];
    if (paymentMethod === "credit_card") {
      const discountRate = total_price > 0 ? final_price / total_price : 1;
      let calculatedPaidPriceTotal = 0;

    for (let index = 0; index < cart.items.length; index++) {
        const cartItem = cart.items[index];
        const variant = cartItem.variant;
        let itemDiscountedPrice = parseFloat((parseFloat(variant.price) * discountRate).toFixed(2));
        for (let i = 0; i < cartItem.quantity; i++) {
          if (index === cart.items.length - 1 && i === cartItem.quantity - 1) {
            const diff = parseFloat((final_price - calculatedPaidPriceTotal).toFixed(2));
            itemDiscountedPrice = diff;
          }
          basketItemsForIyzico.push({
            id: variant.id.toString(),
            name: variant.product.name,
            category1: "Pet Shop",
            itemType: "PHYSICAL",
            price: itemDiscountedPrice.toFixed(2),
          });
          calculatedPaidPriceTotal = parseFloat((calculatedPaidPriceTotal + itemDiscountedPrice).toFixed(2));
        }
      }
    }
    const address = await Address.findOne({
      where: { user_id: userId, is_default: true },
      transaction: t,
    });

    if (!address) {
      throw new Error(
        "Varsayılan teslimat adresiniz bulunamadı. Lütfen bir adres ekleyin veya varsayılan olarak işaretleyin.",
      );
    }

    const user = await User.findByPk(userId, { transaction: t });

    const newOrder = await Order.create(
      {
        user_id: userId,
        address_id:address.id,
        total_price: final_price,
        status: "pending",
        coupon_id: appliedCoupon ? appliedCoupon.id : null,
        created_at: new Date(),
      },
      { transaction: t },
    );

    await OrderItem.bulkCreate(
      orderItemsData.map((item) => ({ ...item, order_id: newOrder.id })),
      { transaction: t },
    );

    //KREDİ KARTI
    if (paymentMethod === "credit_card") {
      const iyzicoData = {
        locale: "tr",
        conversationId: newOrder.id.toString(),
        price: final_price.toFixed(2),
        paidPrice: final_price.toFixed(2),
        currency: "TRY",
        installment: "1",
        basketId: newOrder.id.toString(),
        paymentChannel: "WEB",
        paymentGroup: "PRODUCT",
        paymentCard: paymentCard,
        buyer: {
          id: user.id.toString(),
          name: user.name,
          surname: user.surname,
          email: user.email,
          city: address.city,
          country: "Turkey",
          identityNumber: "identityNumber",
          registrationAddress: `${address.district} ${address.address_detail}`,
        },
        shippingAddress: {
          contactName: `${user.name} ${user.surname}`,
          city: address.city,
          country: "Turkey",
          address: address.address_detail,
        },
        billingAddress: {
          contactName: `${user.name} ${user.surname}`,
          city: address.city,
          country: "Turkey",
          address: address.address_detail,
        },
        basketItems: basketItemsForIyzico,
      };

      const result = await createPayment(iyzicoData);

      if (result.status === "success") {
        await Payment.create(
          {
            order_id: newOrder.id,
            payment_method: "credit_card",
            status: "success",
            transaction_id: result.paymentId,
            amount: final_price,
            raw_result: JSON.stringify(result),
          },
          { transaction: t },
        );
        newOrder.status = "preparing";
        await newOrder.save({ transaction: t });
      } else {
        throw new Error(result.errorMessage || "Kart ödemesi reddedildi.");
      }
    } else if (paymentMethod === "cash_on_delivery") {
      // KAPIDA ÖDEME
      await Payment.create(
        {
          order_id: newOrder.id,
          payment_method: "cash_on_delivery",
          status: "pending",
          transaction_id: `COD-${newOrder.id}-${Date.now()}`,
          amount: final_price,
        },
        { transaction: t },
      );
      newOrder.status = "preparing";
      await newOrder.save({ transaction: t });
    } else if (paymentMethod === "bank_transfer") {
      // HAVALE / EFT
      await Payment.create(
        {
          order_id: newOrder.id,
          payment_method: "bank_transfer",
          status: "pending",
          transaction_id: `BANK-${newOrder.id}-${Date.now()}`,
          amount: final_price,
        },
        { transaction: t },
      );

      newOrder.status = "pending";
      await newOrder.save({ transaction: t });
    } else {
      throw new Error("Geçersiz ödeme yöntemi seçildi.");
    }
    await CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
    await ShoppingCart.destroy({ where: { id: cart.id }, transaction: t });

    await t.commit();

    return res.status(201).json({
      success: 1,
      message:
        paymentMethod === "bank_transfer"
          ? "Sipariş alındı, havale onayınız bekleniyor."
          : "Siparişiniz başarıyla oluşturuldu.",
      data: { orderId: newOrder.id, method: paymentMethod },
    });
  } catch (err) {
    if (t) await t.rollback();
    logger.error(`Checkout Hatası: ${err.message}`);
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

    return res.json({
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
    return res.json({
      success: 1,
      data: payments,
      message: "Ödeme geçmişi başarıyla listelendi.",
    });
  } catch (err) {
    next(err);
  }
};
