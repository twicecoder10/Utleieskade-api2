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

exports.getAdminChats = async (req, res) => {
  try {
    const adminId = req.user.id;
    const chats = await chatService.getAdminChats(adminId);

    responseHandler.setSuccess(200, "Admin chats retrieved successfully", chats);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error retrieving admin chats: ", error);
    responseHandler.setError(500, "Internal server error!");
    return responseHandler.send(res);
  }
};

exports.getChattableUsers = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { search } = req.query;
    const users = await chatService.getChattableUsers(adminId, search || "");

    responseHandler.setSuccess(200, "Chattable users retrieved successfully", users);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error retrieving chattable users: ", error);
    responseHandler.setError(500, "Internal server error!");
    return responseHandler.send(res);
  }
};

exports.getCommunicationHistory = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;

    if (!userId) {
      responseHandler.setError(400, "User ID is required");
      return responseHandler.send(res);
    }

    const history = await chatService.getCommunicationHistory(adminId, userId);

    responseHandler.setSuccess(
      200,
      "Communication history retrieved successfully",
      history
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error retrieving communication history: ", error);
    responseHandler.setError(500, "Internal server error!");
    return responseHandler.send(res);
  }
};