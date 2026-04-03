const { Wishlist, Product } = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");
// Read
exports.getMyWishlist = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(req.query.page, req.query.per_page);
    const targetUserId = (req.user.role === "admin" && req.query.userId) 
      ? req.query.userId 
      : req.user.id;

    const { count, rows: wishlist } = await Wishlist.findAndCountAll({
      where: { user_id: targetUserId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "image", "stock"],
        },
      ],
      limit,
      offset,
    });
  if (!wishlist || wishlist.length === 0) {
      return res.status(404).json({
        success: 1,
        data: null,
        message: "Favori listeniz henüz boş.",
      });
    }
    res.json({
      success: 1,
      data: {
        wishlist,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: targetUserId === req.user.id ? "Favori listeniz listelendi." : "Kullanıcının favori listesi getirildi.",
    });
  } catch (err) {
    next(err);
  }
};
//create
exports.addToWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const user_id = req.user.id;
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Ürün bulunamadı." });
    }
    const existingWish = await Wishlist.findOne({
      where: { user_id, product_id },
    });

    if (existingWish) {
      return res.status(400).json({
        success: 0,
        data: null,
        message: "Bu ürün zaten favorilerinizde ekli.",
      });
    }
    const newWish = await Wishlist.create({
      user_id,
      product_id,
    });

    res.status(201).json({
      success: 1,
      data: newWish,
      message: "Ürün favorilere eklendi.",
    });
  } catch (err) {
    next(err);
  }
};

// delete
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const user_id = req.user.id;

    const deleted = await Wishlist.destroy({
      where: { user_id, product_id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Ürün favori listenizde bulunamadı.",
      });
    }
    res.json({
      success: 1,
      data: null,
      message: "Ürün favorilerden kaldırıldı.",
    });
  } catch (err) {
    next(err);
  }
};
