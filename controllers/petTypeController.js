const { PetType,Product} = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");

//read
exports.getAllPetType = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page || 10,
    );
    const { count, rows: petType } = await PetType.findAndCountAll({
      limit,
      offset,
    });
    if (!petType || petType.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "ürün bulunamadı." });
    }
    res.json({
      success: 1,
      data: {
        petType,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: "ürünler listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

//create
exports.createPetType = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ success: 0, data: null, message: "Tür adı boş olamaz." });
    }
    const existing = await PetType.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res
        .status(400)
        .json({
          success: 0,
          data: null,
          message: "Bu evcil hayvan türü zaten mevcut.",
        });
    }
    const newPetType = await PetType.create({ name: name.trim() });
    res.status(201).json({
      success: 1,
      data: newPetType,
      message: "Tür başarıyla oluşturuldu.",
    });
  } catch (err) {
    next(err);
  }
};

//update
exports.updatePetType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const petType = await PetType.findByPk(id);
    if (!petType) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Tür bulunamadı." });
    }
    if (!name) {
      return res
        .status(400)
        .json({ success: 0, data: null, message: "Lütfen tür adını girin." });
    }
    petType.name = name;
    await petType.save();
    res.json({
      success: 1,
      data: petType,
      message: "Tür başarıyla güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

//delete
exports.deletePetType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const petType = await PetType.findByPk(id);
    if (!petType) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Tür bulunamadı." });
    }
    const hasProducts = await Product.findOne({ where: { pet_type_id: id } });
    if (hasProducts) {
      return res
        .status(400)
        .json({
          success: 0,
          data: null,
          message: "Bu türe ait ürünler var, önce onları silmelisiniz.",
        });
    }
    await petType.destroy();
    res.json({ success: 1, data: null, message: "Tür başarıyla silindi." });
  } catch (err) {
    next(err);
  }
};
