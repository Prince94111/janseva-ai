const { AppError } = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  const payload = {
    message: err.message || "Internal Server Error",
  };

  if (process.env.NODE_ENV !== "production") {
    payload.name = err.name;
    payload.stack = err.stack;
    if (err.errors) payload.errors = err.errors;
  } else if (!isOperational) {
    payload.message = "Internal Server Error";
  }

  res.status(statusCode).json(payload);
}

module.exports = { errorHandler };

