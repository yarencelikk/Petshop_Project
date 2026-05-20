const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsRoot = path.join(__dirname, "..", "public", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = path.join(uploadsRoot, "others");

    if (file.fieldname === "profile_image" || file.fieldname === "image") {
      dest = path.join(uploadsRoot, "profiles");
    } else if (
      file.fieldname === "product_image" ||
      file.fieldname === "product_images" ||
      file.fieldname === "product_images[]"
    ) {
      dest = path.join(uploadsRoot, "products");
    }

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    cb(null, dest);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        path.extname(file.originalname).toLowerCase(),
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/gif",
  ];
  const isImageField = [
    "profile_image",
    "image",
    "product_image",
    "product_images",
    "product_images[]",
  ].includes(file.fieldname);

  if (isImageField) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Sadece .png, .jpg, .jpeg ve .webp formatlari desteklenir!"),
        false,
      );
    }
  } else {
    cb(new Error("Bilinmeyen dosya alani (Fieldname)!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
