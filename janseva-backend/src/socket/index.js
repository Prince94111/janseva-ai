const { Server } = require("socket.io");

let io;

function initSocket(httpServer, { corsOrigin, isProd }) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin === "*" ? true : corsOrigin,
      credentials: corsOrigin !== "*",
    },
    serveClient: !isProd,
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { id: socket.id });

    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
}

module.exports = { initSocket, getIO };

