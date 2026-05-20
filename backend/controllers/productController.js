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

const getUploadedProductImageUrls = (req) => {
  if (req.files) {
    const multiImages = req.files.product_images || [];
    const bracketImages = req.files["product_images[]"] || [];
    const singleImage = req.files.product_image || [];
    return [...multiImages, ...bracketImages, ...singleImage].map(
      (file) => `/uploads/products/${file.filename}`,
    );
  }

  if (req.file) {
    return [`/uploads/products/${req.file.filename}`];
  }

  return [];
};

const deleteProductImageFiles = (imageUrls = []) => {
  imageUrls.filter(Boolean).forEach((imageUrl) => {
    const imagePath = path.join(__dirname, "..", "public", imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  });
};

const getStoredProductImages = (product) => {
  const images = Array.isArray(product.images) ? product.images : [];
  return [...new Set(images.filter(Boolean))];
};

const emptyToNull = (value) => {
  return value === undefined || value === "" ? null : value;
};

const parseProductVariants = (variants) => {
  if (!variants) return [];

  const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
  if (!Array.isArray(parsedVariants)) return [];

  return parsedVariants
    .map((variant) => ({
      variant_name: emptyToNull(variant.variant_name),
      price: emptyToNull(variant.price),
      stock: emptyToNull(variant.stock),
      sku: emptyToNull(variant.sku),
    }))
    .filter((variant) => {
      return Object.values(variant).some((value) => value !== null);
    });
};

//Read
exports.getAllProducts = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page || 2,
    );
    const where = {};
    if (req.query.pet_type) where.pet_type_id = req.query.pet_type;
    if (req.query.category) where.category_id = req.query.category;
    if (req.query.brand) where.brand_id = req.query.brand;
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      if (searchTerm) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
          {
            brand_id: {
              [Op.in]: sequelize.literal(
                `(SELECT "id" FROM "Brands" WHERE "name" ILIKE ${sequelize.escape(
                  `%${searchTerm}%`,
                )})`,
              ),
            },
          },
        ];
      }
    }
    const variantWhere = {};
    if (req.query.min_price) {
      variantWhere.price = {
        ...variantWhere.price,
        [Op.gte]: Number(req.query.min_price),
      };
    }
    if (req.query.max_price) {
      variantWhere.price = {
        ...variantWhere.price,
        [Op.lte]: Number(req.query.max_price),
      };
    }
    const sort = req.query.sort || "";
    const order =
      sort === "price_asc"
        ? [[{ model: ProductVariant, as: "variants" }, "price", "ASC"]]
        : sort === "price_desc"
          ? [[{ model: ProductVariant, as: "variants" }, "price", "DESC"]]
          : sort === "name_desc"
            ? [["name", "DESC"]]
            : [["name", "ASC"]];
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      distinct: true,
      include: [
        { model: Brand, as: "brand" },
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["id", "variant_name", "price", "stock", "sku"],
          where:
            Object.keys(variantWhere).length > 0 ? variantWhere : undefined,
          required: Object.keys(variantWhere).length > 0,
        },
      ],
      order,
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

//ürün detayı

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Brand, as: "brand" },
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["id", "variant_name", "price", "stock", "sku"],
        },
      ],
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Ürün bulunamadı." });
    }

    return res.json({
      success: 1,
      data: product,
      message: "Ürün detayı getirildi.",
    });
  } catch (err) {
    next(err);
  }
};

//create
exports.createProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  let uploadedImageUrls = [];

  try {
    const { category_id, brand_id, pet_type_id, name, description, variants } =
      req.body;

    uploadedImageUrls = getUploadedProductImageUrls(req);
    if (uploadedImageUrls.length === 0) {
      await t.rollback();
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
        images: uploadedImageUrls,
      },
      { transaction: t },
    );
    const parsedVariants = parseProductVariants(variants);
    if (parsedVariants.length >= 0) {
      const variantsData = parsedVariants.map((v) => ({
        ...v,
        product_id: newProduct.id,
      }));

      if (variantsData.length > 0) {
        await ProductVariant.bulkCreate(variantsData, { transaction: t });
      }
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
    const shouldCleanupUploadedFiles = !t.finished;
    if (!t.finished) await t.rollback();
    if (shouldCleanupUploadedFiles) deleteProductImageFiles(uploadedImageUrls);
    next(err);
  }
};

//update
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, brand_id, pet_type_id, name, description } = req.body;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Güncellenecek ürün bulunamadı.",
      });
    }

    const imageUrls = getUploadedProductImageUrls(req);
    let finalImageUrls = product.images || [];

    if (imageUrls.length > 0) {
      deleteProductImageFiles(getStoredProductImages(product));
      finalImageUrls = imageUrls;
    }
    const updatedProduct = await product.update({
      category_id,
      brand_id,
      pet_type_id,
      name,
      description,
      images: finalImageUrls,
    });

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
    const { variant_name, price, stock, sku } = req.body;

    const variant = await ProductVariant.findByPk(id);

    if (!variant) {
      return res
        .status(404)
        .json({ success: 0, message: "Varyant bulunamadı." });
    }
    await variant.update({
      variant_name:
        variant_name !== undefined ? emptyToNull(variant_name) : variant.variant_name,
      price: price !== undefined ? emptyToNull(price) : variant.price,
      stock: stock !== undefined ? stock : variant.stock,
      sku: sku !== undefined ? emptyToNull(sku) : variant.sku,
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
      await t.rollback();
      return res
        .status(403)
        .json({ success: 0, message: "Ürün silme yetkiniz yok." });
    }

    const product = await Product.findByPk(id, {
      include: [{ model: ProductVariant, as: "variants" }],
    });

    if (!product) {
      await t.rollback();
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
      await t.rollback();
      return res.status(400).json({
        success: 0,
        message:
          "Bu ürünün seçenekleri geçmiş siparişlerde kayıtlı olduğu için silinemez. Stoğu 0 yaparak pasife alabilirsiniz.",
      });
    }

    deleteProductImageFiles(getStoredProductImages(product));

    await ProductVariant.destroy({ where: { product_id: id }, transaction: t });
    await product.destroy({ transaction: t });

    await t.commit();
    return res.json({
      success: 1,
      message: "Ürün ve bağlı tüm seçenekler başarıyla silindi.",
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
