const fs = require("fs");
const path = require("path");
const { Product,ProductVariant,Brand, OrderItem } = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");
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
    res.json({
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
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: 0,
        data: null,
        message: "Ürün ekleme yetkiniz yok.",
      });
    }
    const {
      category_id,
      brand_id,
      pet_type_id,
      name,
      description,
    } = req.body;
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    } else {
      return res.status(400).json({
        success: 0,
        data: null,
        message: "Ürün resmi yüklemek zorunludur.",
      });
    }
    const newProduct = await Product.create({
      category_id,
      brand_id,
      pet_type_id,
      name,
      description,
      image: imageUrl,
    });

    res.status(201).json({
      success: 1,
      data: newProduct,
      message: "Ürün başarıyla eklendi.",
    });
  } catch (err) {
    next(err);
  }
};

//update
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      brand_id,
      pet_type_id,
      name,
      description,
    } = req.body;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Güncellenecek ürün bulunamadı.",
      });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: 0,
        data: null,
        message: "Bu ürünü güncelleme yetkiniz yok.",
      });
    }
    let finalImageUrl = product.image;
    if (product.image) {
      const oldImagePath = path.join(__dirname, "..", "public", product.image);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    finalImageUrl = `/uploads/products/${req.file.filename}`;
    await product.update({
      category_id,
      brand_id,
      pet_type_id,
      name,
      description,
      image: finalImageUrl,
    });
    res.json({
      success: 1,
      data: product,
      message: "Ürün başarıyla güncellendi.",
    });
  } catch (error) {
    next(error);
  }
};

//delete
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: 0, data: null, message: "Ürün silme yetkiniz yok." });
    }
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Silinecek ürün bulunamadı.",
      });
    }
    const isUsedInOrder = await OrderItem.findOne({
      where: { product_id: id },
    });
    if (isUsedInOrder) {
      return res.status(400).json({
        success: 0,
        data: null,
        message:
          "Bu ürün geçmiş siparişlerde kayıtlı olduğu için silinemez. Lütfen stoğunu 0 yaparak satışa kapatın.",
      });
    }
    if (product.image) {
      const imagePath = path.join(__dirname, "..", "public", product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await product.destroy();

    res.json({
      success: 1,
      data: null,
      message: "Ürün ve bağlı resim dosyası başarıyla silindi.",
    });
  } catch (error) {
    next(error);
  }
};
