require("dotenv").config();
const http = require("http");

const { createApp } = require("./src/app");
const { connectDB } = require("./src/config/db");
const { getEnv } = require("./src/config/env");
const { initSocket } = require("./src/socket");

async function start() {
  const env = getEnv();

  await connectDB(env.MONGO_URI);

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server, {
    corsOrigin: env.CORS_ORIGIN,
    isProd: env.NODE_ENV === "production",
  });

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${env.PORT}`);
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received. Shutting down...`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled Promise rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught exception:", err);
  process.exit(1);
});

start();

