const path = require("path");

const dotenv = require("dotenv");

let loaded = false;

function loadEnv() {
  if (loaded) return;

  const result = dotenv.config({
    path: process.env.DOTENV_PATH || path.resolve(process.cwd(), ".env"),
  });

  if (result.error && process.env.NODE_ENV !== "production") {
    throw result.error;
  }

  loaded = true;
}

function getEnv() {
  loadEnv();

  const PORT = Number.parseInt(process.env.PORT ?? "5000", 10);
  const NODE_ENV = process.env.NODE_ENV ?? "development";
  const MONGO_URI = process.env.MONGO_URI;
  const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
  const JWT_SECRET = process.env.JWT_SECRET;
  const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
  const CLOUDINARY_KEY = process.env.CLOUDINARY_KEY;
  const CLOUDINARY_SECRET = process.env.CLOUDINARY_SECRET;

  if (!MONGO_URI) {
    throw new Error("Missing required env var: MONGO_URI");
  }

  if (!JWT_SECRET) {
    throw new Error("Missing required env var: JWT_SECRET");
  }

  if (Number.isNaN(PORT) || PORT <= 0) {
    throw new Error("Invalid env var: PORT");
  }

  if (!CLOUDINARY_NAME || !CLOUDINARY_KEY || !CLOUDINARY_SECRET) {
  throw new Error("Missing required env vars: CLOUDINARY");
  }

  return {
    PORT,
    NODE_ENV,
    MONGO_URI,
    CORS_ORIGIN,
    JWT_SECRET,
    CLOUDINARY_NAME,
    CLOUDINARY_KEY,
    CLOUDINARY_SECRET,
  };
}

module.exports = { getEnv };

