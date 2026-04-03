const { Address } = require("../models");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");

//read
exports.getAddress = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page,
    );
    const whereCondition =
      req.user.role !== "admin" ? { user_id: req.user.id } : {};
    const { count, rows: addresses } = await Address.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["is_default", "DESC"]],
    });
    if (!addresses || addresses.length === 0) {
      res
        .status(404)
        .json({ success: 0, data: null, message: "adres bulunamadı." });
    }
    res.json({
      success: 1,
      data: {
        addresses,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: "adresler listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

//create
exports.createAddress = async (req, res, next) => {
  try {
    const {
      title,
      city,
      district,
      address_detail,
      is_default,
      target_user_id,
    } = req.body;
    const final_user_id =
      req.user.role === "admin" && target_user_id
        ? target_user_id
        : req.user.id;
    if (is_default === true || is_default === 1) {
      await Address.update(
        { is_default: false },
        { where: { user_id: final_user_id } },
      );
    }
    const newAddress = await Address.create({
      user_id: final_user_id,
      title,
      city,
      district,
      address_detail,
      is_default: is_default || false,
    });
    res.json({ success: 1, data: newAddress, message: "adres oluşturuldu." });
  } catch (err) {
    next(err);
  }
};

//update
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, city, district, address_detail, is_default } = req.body;
    const user_id = req.user.id;

    const query =
      req.user.role === "admin"
        ? { where: { id } }
        : { where: { id, user_id } };
    const address = await Address.findOne(query);

    if (!address) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Adres bulunamadı." });
    }
    if (is_default === true || is_default === 1) {
      await Address.update(
        { is_default: false },
        { where: { user_id: address.user_id } },
      );
    }
    await address.update({
      title: title || address.title,
      city: city || address.city,
      district: district || address.district,
      address_detail: address_detail || address.address_detail,
      is_default: is_default !== undefined ? is_default : address.is_default,
    });
    res.json({
      success: 1,
      data: address,
      message: "Adres başarıyla güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

//delete
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const query =
      req.user.role === "admin"
        ? { where: { id } }
        : { where: { id, user_id } };

    const address = await Address.findOne(query);
    if (!address) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Silinecek adres bulunamadı veya bu işlem için yetkiniz yok.",
      });
    }

    const wasDefault = address.is_default;
    const ownerId = address.user_id;

    await address.destroy();

    if (wasDefault) {
      const remainingAddress = await Address.findOne({
        where: { user_id: ownerId },
        order: [["id", "DESC"]],
      });

      if (remainingAddress) {
        remainingAddress.is_default = true;
        await remainingAddress.save();
      }
    }

    res.json({
      success: 1,
      data: null,
      message:
        "Adres başarıyla silindi ve gerekirse varsayılan adres güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};
