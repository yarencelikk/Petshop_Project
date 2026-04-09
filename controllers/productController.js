const fs = require("fs");
const path = require("path");
const {
  Product,
  ProductVariant,
  Brand,
  OrderItem,
  sequelize,
} = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");
const { Op } = require("sequelize");

//Read
exports.getAllProducts = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page || 40,
    );
    const where = {};
    if (req.query.pet_type) where.pet_type_id = req.query.pet_type;
    if (req.query.category) where.category_id = req.query.category;
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        { model: Brand, as: "brand" },
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["id", "variant_name", "price", "stock", "sku"],
        },
      ],
      limit,
      offset,
    });
    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "ürün bulunamadı." });
    }
    return res.json({
      success: 1,
      data: {
        products,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: "ürünler listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

//create
exports.createProduct = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { category_id, brand_id, pet_type_id, name, description, variants } =
      req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    } else {
      return res.status(400).json({
        success: 0,
        message: "Ürün resmi yüklemek zorunludur.",
      });
    }
    const newProduct = await Product.create(
      {
        category_id,
        brand_id,
        pet_type_id,
        name,
        description,
        image: imageUrl,
      },
      { transaction: t },
    );
    if (variants && variants.length > 0) {
      const variantsData = JSON.parse(variants).map((v) => ({
        ...v,
        product_id: newProduct.id,
      }));

      await ProductVariant.bulkCreate(variantsData, { transaction: t });
    } else {
      throw new Error("En az bir ürün seçeneği (varyant) eklemelisiniz.");
    }
    await t.commit();

    const completedProduct = await Product.findByPk(newProduct.id, {
      include: [{ model: ProductVariant, as: "variants" }],
    });

    return res.status(201).json({
      success: 1,
      data: completedProduct,
      message: "Ürün ve seçenekleri başarıyla oluşturuldu.",
    });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

//update
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, brand_id, pet_type_id, name, description } =
      req.body;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Güncellenecek ürün bulunamadı.",
      });
    }

    let finalImageUrl = product.image;
    if (req.file) {
      if (product.image) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          product.image,
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      finalImageUrl = `/uploads/products/${req.file.filename}`;
    }
    const updatedProduct = await product.update(
      {
        category_id,
        brand_id,
        pet_type_id,
        name,
        description,
        image: finalImageUrl,
      },
    );

    return res.json({
      success: 1,
      data: updatedProduct,
      message: "Ürün başarıyla güncellendi.",
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { variant_name, price, stock } = req.body;

    const variant = await ProductVariant.findByPk(id);

    if (!variant) {
      return res.status(404).json({ success: 0, message: "Varyant bulunamadı." });
    }
    await variant.update({
      variant_name: variant_name || variant.variant_name,
      price: price || variant.price,
      stock: stock !== undefined ? stock : variant.stock,
    });

    return res.json({
      success: 1,
      data: variant,
      message: "Varyant bilgileri başarıyla güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: 0, message: "Ürün silme yetkiniz yok." });
    }

    const product = await Product.findByPk(id, {
      include: [{ model: ProductVariant, as: "variants" }],
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: 0, message: "Silinecek ürün bulunamadı." });
    }

    const variantIds = product.variants.map((v) => v.id);

    const isUsedInOrder = await OrderItem.findOne({
      where: { variant_id: { [Op.in]: variantIds } },
      transaction: t,
    });

    if (isUsedInOrder) {
      return res.status(400).json({
        success: 0,
        message:
          "Bu ürünün seçenekleri geçmiş siparişlerde kayıtlı olduğu için silinemez. Stoğu 0 yaparak pasife alabilirsiniz.",
      });
    }

    if (product.image) {
      const imagePath = path.join(__dirname, "..", "public", product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await ProductVariant.destroy({ where: { product_id: id }, transaction: t });
    await product.destroy({ transaction: t });

    await t.commit();
    return res.json({
      success: 1,
      message: "Ürün ve bağlı tüm seçenekler başarıyla silindi.",
    });
  } catch (error) {
    if (t) await t.rollback();
    next(error);
  }
};
