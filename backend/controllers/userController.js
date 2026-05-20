const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { getPaginationParams, getPagingData } = require("../helpers/pagination");

const parseBooleanPreference = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "on", "yes"].includes(String(value).toLowerCase());
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, surname, email, phone_number, password } = req.body;
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number }],
      },
    });
    if (existingUser) {
      return res.status(400).json({
        success: 0,
        data: null,
        message: "Bu e-posta veya telefon numarası zaten kullanımda.",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name,
      surname,
      email,
      phone_number,
      password: hashedPassword,
      role: "user",
      notification_orders: true,
      notification_deals: false,
      created_at: new Date(),
    });

    return res.status(201).json({
      success: 1,
      data: { id: newUser.id, email: newUser.email },
      message: "Kaydınız başarıyla oluşturuldu.",
    });
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { name, surname, email, phone_number, password } = req.body;
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: 0,
        data: null,
        message: "Bu e-posta veya telefon numarası zaten kullanımda.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newAdmin = await User.create({
      name,
      surname,
      email,
      phone_number,
      password: hashedPassword,
      role: "admin",
      notification_orders: true,
      notification_deals: false,
      created_at: new Date(),
    });

    return res.status(201).json({
      success: 1,
      data: {
        id: newAdmin.id,
        name: newAdmin.name,
        surname: newAdmin.surname,
        email: newAdmin.email,
        phone_number: newAdmin.phone_number,
        role: newAdmin.role,
      },
      message: "Admin başarıyla oluşturuldu.",
    });
  } catch (err) {
    next(err);
  }
};

//Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: 0,
        data: null,
        message: "Geçersiz e-posta veya şifre.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: 0,
        data: null,
        message: "Geçersiz e-posta veya şifre.",
      });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    await user.update({ token: token });
    return res.json({
      success: 1,
      token: token,
      data: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        role: user.role,
      },
      message: "Başarıyla giriş yapıldı.",
    });
  } catch (err) {
    next(err);
  }
};

//Read
exports.getAllUsers = async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.page,
      req.query.per_page,
    );
    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ["password","token"] },
      limit: limit,
      offset: offset,
      order: [["created_at", "DESC"]],
    });

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Kullanıcı bulunamadı." });
    }

    return res.json({
      success: 1,
      data: {
        users: users,
        pagination: getPagingData(count, req.query.page, limit),
      },
      message: "Tüm kullanıcılar listelendi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Kullanıcı bulunamadı." });
    }

    return res.json({
      success: 1,
      data: user,
      message: "Kullanıcı bilgileri getirildi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const profile = await User.findByPk(user_id, {
      attributes: { exclude: ["password","token"] },
    });

    if (!profile) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Profil bulunamadı." });
    }

    return res.json({
      success: 1,
      data: profile,
      message: "Profil bilgileriniz başarıyla getirildi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const {
      name,
      surname,
      phone_number,
      notification_orders,
      notification_deals,
    } = req.body;
    const user = await User.findByPk(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Kullanıcı bulunamadı." });
    }
    const profileImageFile =
      req.file ||
      req.files?.find((file) =>
        ["profile_image", "image"].includes(file.fieldname),
      );

    let imageUrl = user.image;
    if (profileImageFile) {
      if (user.image) {
        const oldImagePath = path.join(__dirname, "..", "public", user.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/profiles/${profileImageFile.filename}`;
    }
    const profileUpdates = {
      name: name || user.name,
      surname: surname || user.surname,
      phone_number: phone_number || user.phone_number,
      notification_orders: parseBooleanPreference(
        notification_orders,
        user.notification_orders,
      ),
      notification_deals: parseBooleanPreference(
        notification_deals,
        user.notification_deals,
      ),
      image: imageUrl,
    };

    await User.update(profileUpdates, { where: { id: user_id } });

    const updatedUser = await User.findByPk(user_id, {
      attributes: { exclude: ["password", "token"] },
    });

    return res.json({
      success: 1,
      data: updatedUser,
      upload_debug: {
        received_file: Boolean(profileImageFile),
        received_fields: req.files?.map((file) => file.fieldname) || [],
      },
      message: "Profil bilgileriniz başarıyla güncellendi.",
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: 0, data: null, message: "Kullanıcı bulunamadı." });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: 0, data: null, message: "Mevcut şifreniz hatalı." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.json({
      success: 1,
      data: null,
      message:
        "Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle giriş yapın.",
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: 0,
        data: null,
        message: "Silinecek kullanıcı bulunamadı.",
      });
    }
    if (user.image) {
      const imagePath = path.join(__dirname, "..", "public", user.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await user.destroy();
    return res.json({
      success: 1,
      data: null,
      message: "Kullanıcı ve bağlı tüm veriler başarıyla silindi.",
    });
  } catch (err) {
    next(err);
  }
};
