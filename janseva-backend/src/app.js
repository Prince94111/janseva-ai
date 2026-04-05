const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const apiRouter = require("./routes");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { getEnv } = require("./config/env");

function createApp() {
  const env = getEnv();
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: env.CORS_ORIGIN !== "*",
    })
  );

  if (env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

