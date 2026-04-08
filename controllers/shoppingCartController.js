const { ShoppingCart, ProductVariant, Product,CartItem,sequelize} = require("../models");

// READ
exports.getCart = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const cart = await ShoppingCart.findAll({
      where: { user_id },
      include: [
        {
          model: CartItem,
          as: "items",
          attributes: ["id", "quantity"],
          include: [
            {
              model: ProductVariant,
              as: "variant",
              attributes: ["id", "variant_name", "price", "stock"],
              include: [{ model: Product, as: "product", attributes: ["id", "name", "image"] }],
            },
          ],
        },
      ],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({
        success: 1,
        data: { items: [], totalAmount: "0.00" },
        message: "Sepetiniz boş.",
      });
    }

    const totalAmount = cart.items.reduce((acc, item) => {
      const price = item.variant ? Number(item.variant.price) : 0;
      return acc + (price * item.quantity);
    }, 0);

    return res.json({
      success: 1,
      data: {
        cart_id: cart.id,
        items: cart.items,
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
  const t = await sequelize.transaction();
  try {
    const { variant_id,quantity } = req.body;
    const user_id = req.user.id;

  let [cart] = await ShoppingCart.findOrCreate({
      where: { user_id },
      defaults: { user_id },
      transaction: t
    });

    let cartItem = await CartItem.findOne({
      where: { cart_id: cart.id, variant_id },
      transaction: t
    });

    if (cartItem) {
      cartItem.quantity += parseInt(quantity);
      await cartItem.save({ transaction: t });
    } else {
      await CartItem.create({
        cart_id: cart.id,
        variant_id,
        quantity
      }, { transaction: t });
    }
    await t.commit();
    return res.status(201).json({ success: 1,data: cartItem ,message: "Ürün sepete eklendi." });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
// DELETE
exports.removeFromCart = async (req, res, next) => {
  try {
    const { variant_id } = req.params;
    const user_id = req.user.id;

    const cart = await ShoppingCart.findOne({ where: { user_id } });
    if (!cart) {
      return res.status(404).json({ success: 0, message: "Sepet bulunamadı." });
    }

    const result = await CartItem.destroy({
      where: { 
        cart_id: cart.id, 
        variant_id 
      },
    });

    if (!result) {
      return res.status(404).json({ success: 0, data: null, message: "Ürün sepetinizde bulunamadı." });
    }

    return res.json({ success: 1, data: null, message: "Ürün sepetten kaldırıldı." });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const cart = await ShoppingCart.findOne({ where: { user_id } });
    if (cart) {
      await CartItem.destroy({ where: { cart_id: cart.id } });
    }
    return res.json({ success: 1, data: null, message: "Sepet temizlendi." });
  } catch (err) {
    next(err);
  }
};
