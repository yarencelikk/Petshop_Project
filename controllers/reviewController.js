const { Review, ProductVariant, Order, OrderItem, User } = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");

//Read
exports.getAllReviews = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page,
    );
    const { count, rows: reviews } = await Review.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        { model: User, as: "user", attributes: ["name", "surname"] },
        {
          model: ProductVariant,
          as: "variant",
          attributes: ["variant_name"],
        },
      ],
    });
    if (!reviews || reviews.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Henüz yorum yapılmamış" });
    }
    res.json({
      success: 1,
      data: {
        reviews: reviews,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: "Yorumlar ve puanlar listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

//create
exports.createReview = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { variant_id, rating, comment } = req.body;
    const purchasedOrder = await Order.findOne({
      where: {
        user_id,
        status: "delivered",
      },
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          required: true,
          where: { variant_id },
          include: [{ model: ProductVariant, as: "variants" }],
        },
      ],
    });

    if (!purchasedOrder) {
      return res.status(403).json({
        success: 0,
        data: null,
        message:
          "Sadece satın aldığınız ve size ulaşan ürünlere değerlendirme yapabilirsiniz.",
      });
    }

    const product_id = purchasedOrder.orderItems[0].variants.product_id;
    const existingReview = await Review.findOne({
      where: { user_id, product_id },
    });
    if (existingReview) {
      return res.status(400).json({
        success: 0,
        data: null,
        message: "Bu ürün için zaten bir değerlendirme yapmışsınız.",
      });
    }
    const newReview = await Review.create({
      user_id,
      product_id,
      variant_id,
      rating: rating || 5,
      comment: comment || "",
      created_at: new Date(),
    });
    res.status(201).json({
      success: 1,
      data: newReview,
      message: "değerlendirme başarıyla oluşturuldu.",
    });
  } catch (err) {
    next(err);
  }
};

//update
exports.updateReview = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { product_id } = req.params;
    const { rating, comment } = req.body;
    const review = await Review.findOne({
      where: {
        user_id: user_id,
        product_id: product_id,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Bu ürün için yaptığınız bir değerlendirme bulunamadı.",
      });
    }
    await review.update({
      rating: rating || review.rating,
      comment: comment !== undefined ? comment : review.comment,
    });

    res.json({
      success: 1,
      data: review,
      message: "Değerlendirmeniz başarıyla güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

//delete
exports.deleteReview = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const current_user_id = req.user.id;
    const is_admin = req.user.role === "admin";

    const review = await Review.findOne({
      where: {
        product_id: product_id,
      },
    });

    if (!review) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Yorum bulunamadı." });
    }
    if (!is_admin && review.user_id !== current_user_id) {
      return res.status(403).json({
        success: 0,
        data: null,
        message: "Bu yorumu silme yetkiniz yok.",
      });
    }
    await review.destroy();
    res.json({
      success: 1,
      data: null,
      message: is_admin
        ? "Yorum admin tarafından silindi."
        : "Değerlendirmeniz silindi.",
    });
  } catch (err) {
    next(err);
  }
};
