const { ShoppingCart, ProductVariant, Product } = require("../models");

// READ
exports.getCart = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const cartItems = await ShoppingCart.findAll({
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
              attributes: ["id", "name", "image"],
            },
          ],
        },
      ],
    });

    const totalAmount = cartItems.reduce((acc, item) => {
      const price = item.variant ? Number(item.variant.price) : 0;
      return acc + (price * item.quantity);
    }, 0);

    res.json({
      success: 1,
      data: {
        items: cartItems,
        totalAmount: totalAmount.toFixed(2),
      },
      message: "Sepetiniz getirildi.",
    });
  } catch (err) {
    next(err);
  }
};

// CREATE-UPDATE
exports.addToCart = async (req, res, next) => {
  try {
    const { variant_id } = req.body;
    const quantity = parseInt(req.body.quantity) || 1;
    const user_id = req.user.id;

    const variant = await ProductVariant.findByPk(variant_id);
    if (!variant) {
      return res.status(404).json({ success: 0, data: null, message: "Ürün seçeneği bulunamadı." });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({
        success: 0,
        data: null,
        message: `Yetersiz stok. Mevcut: ${variant.stock} (${variant.variant_name})`,
      });
    }

    const existingItem = await ShoppingCart.findOne({
      where: { user_id, variant_id },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > variant.stock) {
        return res.status(400).json({
          success: 0,
          data: null,
          message: "Toplam miktar stok sınırını aşıyor.",
        });
      }

      existingItem.quantity = newQuantity;
      await existingItem.save();
      return res.json({
        success: 1,
        data: existingItem,
        message: "Sepetteki ürün miktarı artırıldı.",
      });
    }

    const newItem = await ShoppingCart.create({
      user_id,
      variant_id,
      quantity,
    });

    res.status(201).json({ success: 1, data: newItem, message: "Ürün sepete eklendi." });
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.removeFromCart = async (req, res, next) => {
  try {
    const { variant_id } = req.params;
    const user_id = req.user.id;

    const result = await ShoppingCart.destroy({
      where: { user_id, variant_id },
    });

    if (!result) {
      return res.status(404).json({ success: 0, data: null, message: "Ürün sepetinizde bulunamadı." });
    }

    res.json({ success: 1, data: null, message: "Ürün sepetten kaldırıldı." });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    await ShoppingCart.destroy({ where: { user_id } });
    res.json({ success: 1, data: null, message: "Sepet temizlendi." });
  } catch (err) {
    next(err);
  }
};
