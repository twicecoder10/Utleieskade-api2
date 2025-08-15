const chatService = require("../services/chatService");
const responseHandler = require("../utils/responseHandler");

exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await chatService.getUserChats(userId);

    responseHandler.setSuccess(200, "Chats retrieved successfully", chats);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error retrieving chats: ", error);
    responseHandler.setError(500, "Internal server error!");
    return responseHandler.send(res);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);

    responseHandler.setSuccess(
      200,
      "Messages retrieved successfully",
      messages
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error getting messages: ", error);
    responseHandler.setError(500, "Internal server error!");
    return responseHandler.send(res);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, messageText } = req.body;
    const message = await chatService.sendMessage(
      senderId,
      receiverId,
      messageText
    );

    responseHandler.setSuccess(201, "Message sent successfully", message);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error sending message: ", error);
    responseHandler.setError(500, "Internal server error!");
    return responseHandler.send(res);
  }
};
