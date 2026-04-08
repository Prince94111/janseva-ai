require("dotenv").config();
const http = require("http");

const { createApp } = require("./src/app");
const { connectDB } = require("./src/config/db");
const { getEnv } = require("./src/config/env");
const { initSocket } = require("./src/socket");

async function start() {
  try {
    const env = getEnv();

    // ✅ Ensure PORT fallback (VERY IMPORTANT for Railway)
    const PORT = env.PORT || process.env.PORT || 5000;

    // ✅ Connect DB
    await connectDB(env.MONGO_URI);

    const app = createApp();
    const server = http.createServer(app);

    // ✅ Socket init
    initSocket(server, {
      corsOrigin: env.CORS_ORIGIN || "*",
      isProd: env.NODE_ENV === "production",
    });

    // ✅ Start server
    server.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
    });

    // ✅ Graceful shutdown
    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down...`);
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

  } catch (error) {
    console.error("❌ Startup error:", error);
    process.exit(1);
  }
}

// ✅ Global error handlers
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

// ✅ Start app
start();