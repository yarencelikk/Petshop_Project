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
        { model: Order, as: "order", attributes: ["id"] },
      ],
    });
    if (!reviews || reviews.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Henüz yorum yapılmamış" });
    }
    return res.json({
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
    const { variant_id, rating, comment, order_id } = req.body;
    const whereCondition = { variant_id };
    const purchasedItem = await OrderItem.findOne({
      where: whereCondition,
      include: [
        {
          model: Order,
          as: "order",
          where: {
            user_id,
            status: "delivered",
            ...(order_id && { id: order_id }),
          },
          required: true,
        },
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["product_id"],
          required: true,
        },
      ],
    });

    if (!purchasedItem) {
      return res.status(403).json({
        success: 0,
        message: "Bu siparişe ait teslim edilmiş bir ürün kaydı bulunamadı.",
      });
    }

    const product_id = purchasedItem.variants.product_id;
    const actualOrderId = purchasedItem.order_id;
    const existingReview = await Review.findOne({
      where: {
        user_id,
        variant_id,
        order_id: actualOrderId,
      },
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
      order_id: actualOrderId,
      rating: rating || 5,
      comment: comment || "",
      created_at: new Date(),
    });
    return res.status(201).json({
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
    const { id } = req.params;
    const user_id = req.user.id;
    const { rating, comment } = req.body;
    const review = await Review.findOne({
      where: {
        id: id,
        user_id: user_id,
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

    return res.json({
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
    const { id } = req.params;
    const current_user_id = req.user.id;
    const is_admin = req.user.role === "admin";

    const review = await Review.findOne({
      where: {
          id: id,
      },
    });

    if (!review) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Değerlendirme bulunamadı." });
    }
    if (!is_admin && review.user_id !== current_user_id) {
      return res.status(403).json({
        success: 0,
        data: null,
        message: "Bu değerlendirmeyi silme yetkiniz yok.",
      });
    }
    await review.destroy();
    return res.json({
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
