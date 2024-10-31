const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "https://star-blog-frontend-git-main-vemanueldevs-projects.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
};

const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  initSocket,
  getSocket,
};
