const { Brand, Product } = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");

//Read
exports.getAllBrand = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page,
    );
    const { count, rows: brands } = await Brand.findAndCountAll({
      include: [{ model: Product, as: "products", attributes: ["id", "name"] }],
      limit,
      offset,
      order: [["name", "ASC"]],
    });
    if (!brands || brands.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "marka bulunamadı." });
    }
    return res.json({
      success: 1,
      data: {
        brands: brands,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: "markalar listelendi",
    });
  } catch (err) {
    next(err);
  }
};

//Create
exports.createBrand = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ success: 0, data: null, message: "Marka adı boş olamaz." });
    }
    const newBrand = await Brand.create({ name: name.trim() });
    return res
      .status(201)
      .json({ success: 1, data: newBrand, message: "marka eklendi." });
  } catch (err) {
    next(err);
  }
};

//update
exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const brand = await Brand.findByPk(id);
    if (!brand) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "güncellenecek marka bulunmadı.",
      });
    }
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: 0,
        data: null,
        message: "Marka adı boş olamaz.",
      });
    }
    await brand.update({ name: name.trim() });
    return res.json({
      success: 1,
      data: brand,
      message: "Marka başarıyla güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

//delete
exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByPk(id);
    if (!brand) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Silinecek marka bulunamadı.",
      });
    }
    await brand.destroy();
    return res.json({
      success: 1,
      data: null,
      message: "marka başarıyla silindi.",
    });
  } catch (err) {
    next(err);
  }
};
