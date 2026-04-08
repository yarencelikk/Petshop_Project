const { Wishlist, Product, ProductVariant } = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");
// Read
exports.getMyWishlist = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(req.query.page, req.query.per_page);
    const user_id = req.user.id;

    const { count, rows: wishlist } = await Wishlist.findAndCountAll({
      where: { user_id },
      include: [
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["id", "variant_name", "price", "stock"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image"]
            }
          ]
        },
      ],
      limit,
      offset,
    });

    return res.json({
      success: 1,
      data: { wishlist, pagination: getPagingData(count, req.query.page, limit) },
      message: "Favorileriniz listelendi.",
    });
  } catch (err) {
    next(err);
  }
};
//create
exports.addToWishlist = async (req, res, next) => {
  try {
    const { variant_id } = req.body;
    const user_id = req.user.id;

    const variant = await ProductVariant.findByPk(variant_id);
    if (!variant) {
      return res.status(404).json({ success: 0, message: "Seçilen ürün seçeneği bulunamadı." });
    }

    const [wish, created] = await Wishlist.findOrCreate({
      where: { user_id, variant_id },
      defaults: { user_id, variant_id }
    });

    if (!created) {
      return res.status(400).json({ success: 0, message: "Bu ürün seçeneği zaten favorilerinizde." });
    }

    return res.status(201).json({
      success: 1,
      data: wish,
      message: "Ürün seçeneği favorilere eklendi.",
    });
  } catch (err) {
    next(err);
  }
};

// delete
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { variant_id } = req.params;
    const user_id = req.user.id;

    const deleted = await Wishlist.destroy({
      where: { user_id, variant_id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: 0, message: "Ürün favori listenizde bulunamadı." });
    }

    return res.json({ success: 1, message: "Ürün favorilerden kaldırıldı." });
  } catch (err) {
    next(err);
  }
};
