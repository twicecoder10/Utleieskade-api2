const { sendMessage, markMessagesAsRead } = require("../services/chatService");

const handleClientConnection = (socket, io) => {
  const userId = socket.user.id;
  console.log(`User ${userId} connected`);

  socket.join(userId);

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`);
  });

  handleSendMessage(socket, io);
  handleMarkAsRead(socket, io);
};

const handleSendMessage = (socket, io) => {
  socket.on("sendMessage", async ({ receiverId, messageText }) => {
    try {
      const senderId = socket.user.id;
      if (!receiverId || !messageText) return;

      const message = await sendMessage(senderId, receiverId, messageText);

      io.to(receiverId).emit("receiveMessage", message);
      io.to(senderId).emit("messageSent", message);
      socket.join(message.conversationId);
    } catch (error) {
      console.error("Error sending message", error);
    }
  });
};

const handleMarkAsRead = (socket, io) => {
  socket.on("markAsRead", async ({ conversationId, userId }) => {
    await markMessagesAsRead(conversationId, userId);
    io.to(conversationId).emit("messagesRead", { conversationId, userId });
  });
};

const handleSocketEvents = (io) => {
  io.on("connection", (socket) => {
    handleClientConnection(socket, io);
  });
};

module.exports = handleSocketEvents;
