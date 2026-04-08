const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "janseva/reports",
    allowed_formats: ["jpg", "png", "webp"],
    resource_type: "image",

    // 🔥 Optimization (important)
    transformation: [{ width: 1280, crop: "limit", quality: "auto" }],
  },
});

const fileFilter = (req, file, cb) => {
  try {
    if (!file || !file.mimetype) {
      return cb(new Error("Invalid file"));
    }

    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }

    const error = new Error("Only JPG, PNG, WEBP images are allowed");
    error.statusCode = 400;
    return cb(error);
  } catch (err) {
    return cb(err);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});

module.exports = upload.array("photos", 5);