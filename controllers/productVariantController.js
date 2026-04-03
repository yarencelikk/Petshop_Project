const { ProductVariant, Product, OrderItem } = require("../models");
//read
exports.getVariantsByProduct = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const variants = await ProductVariant.findAll({
      where: { product_id },
      order: [["price", "ASC"]],
    });
    res.json({
      success: 1,
      data: variants,
      message: "Ürün seçenekleri listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

//create
exports.addVariant = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const { variant_name, price, stock, sku } = req.body;
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Bağlanacak ana ürün bulunamadı.",
      });
    }
    const newVariant = await ProductVariant.create({
      product_id,
      variant_name,
      price,
      stock,
      sku,
    });
    res
      .status(201)
      .json({ success: 1, data: newVariant, message: "Yeni seçenek eklendi." });
  } catch (err) {
    next(err);
  }
};

//update
exports.updateVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { variant_name, price, stock, sku } = req.body;
    const variant = await ProductVariant.findByPk(id);

    if (!variant)
      return res
        .status(404)
        .json({ success: 0, message: "Varyasyon bulunamadı." });
    await variant.update({ variant_name, price, stock, sku });

    res.json({
      success: 1,
      data: variant,
      message: "Varyasyon bilgileri güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

// delete
exports.deleteVariant = async (req, res, next) => {
  try {
    const { variant_id } = req.params;

    const variant = await ProductVariant.findByPk(variant_id);
    if (!variant) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Silinecek varyasyon bulunamadı.",
      });
    }
    const isUsed = await OrderItem.findOne({ where: { variant_id: variant_id } });
    if (isUsed) {
      return res.status(400).json({
        success: 0,
        data: null,
        message:
          "Bu seçenek geçmiş siparişlerde kayıtlı olduğu için silinemez. Stoğu 0 yaparak pasife alabilirsiniz.",
      });
    }

    await variant.destroy();
    res.json({
      success: 1,
      data: null,
      message: "Varyasyon başarıyla silindi.",
    });
  } catch (err) {
    next(err);
  }
};
