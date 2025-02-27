const { verifyToken } = require("../utils/verifyToken");

const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = await verifyToken(token);
    socket.user = decoded.message;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
};

module.exports = { socketAuth };
