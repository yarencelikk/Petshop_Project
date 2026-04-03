const { Category ,Product} = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");

//Read
exports.getAllCategory = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page,
    );
    const { count, rows: categories } = await Category.findAndCountAll({
      include: [{ model: Product, as: 'products', attributes: ["id", "name"] }],
      limit,
      offset,
      order: [["name", "ASC"]],
    });
    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Kategori bulunamadı." });
    }
    res.json({
      success: 1,
      data: {
        categories,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message:"Kategoriler listelendi."
    });
  } catch (err) {
    next(err);
  }
};

//Create
exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const newCategory = await Category.create({ name });
    res
      .status(201)
      .json({ succes: 1, data: newCategory, message: "Kategori oluşturuldu." });
  } catch (err) {
    next(err);
  }
};

//update
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Güncellenecek kategori bulunamadı.",
      });
    }
    const updatedCategory = await category.update({ name: name.trim() });
    res.json({
      success: 1,
      data: updatedCategory,
      message: "Kategori güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

//delete
exports.deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  const category = await Category.findByPk(id);
  if (!category) {
    return res.status(404).json({
      success: 0,
      data: null,
      message: "Silinecek kategori bulunamadı.",
    });
  }
  await category.destroy();

  res.json({
    success: 1,
    data: null,
    message: "kategori başarıyla silindi.",
  });
};
