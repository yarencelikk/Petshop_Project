const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profile_image") {
      cb(null, "public/uploads/profiles/");
    } else if (
      file.fieldname === "product_image"
    ) {
      cb(null, "public/uploads/products/");
    } else {
      cb(null, "public/uploads/others/");
    }
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
  ];
  const isImageField = ["profile_image", "image", "product_image"].includes(
    file.fieldname,
  );

  if (isImageField) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Sadece .png, .jpg, .jpeg ve .webp formatları desteklenir!"),
        false,
      );
    }
  } else {
    cb(new Error("Bilinmeyen dosya alanı (Fieldname)!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
