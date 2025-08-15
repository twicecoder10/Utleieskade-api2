const { Op } = require("sequelize");
const { Conversation, Message, User } = require("../models");

const findOrCreateConversation = async (userOne, userTwo) => {
  let conversation = await Conversation.findOne({
    where: {
      [Op.or]: [
        { userOne, userTwo },
        { userOne: userTwo, userTwo: userOne },
      ],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({ userOne, userTwo });
  }

  return conversation;
};

const getUserChats = async (userId) => {
  return await Conversation.findAll({
    where: {
      [Op.or]: [{ userOne: userId }, { userTwo: userId }],
    },
    include: [
      {
        model: User,
        as: "UserOneDetails",
        attributes: [
          "userId",
          "userFirstName",
          "userLastName",
          "userProfilePic",
        ],
      },
      {
        model: User,
        as: "UserTwoDetails",
        attributes: [
          "userId",
          "userFirstName",
          "userLastName",
          "userProfilePic",
        ],
      },
    ],
    order: [["lastMessageTimestamp", "DESC"]],
  });
};

const sendMessage = async (senderId, receiverId, messageText) => {
  const conversation = await findOrCreateConversation(senderId, receiverId);

  const message = await Message.create({
    conversationId: conversation.conversationId,
    senderId,
    receiverId,
    messageText,
  });

  await conversation.update({
    lastMessage: messageText,
    lastMessageTimestamp: new Date(),
  });

  return message;
};

const getMessages = async (conversationId) => {
  return await Message.findAll({
    where: { conversationId },
    include: [
      {
        model: User,
        as: "sender",
        attributes: [
          "userId",
          "userFirstName",
          "userLastName",
          "userProfilePic",
        ],
      },
      {
        model: User,
        as: "receiver",
        attributes: [
          "userId",
          "userFirstName",
          "userLastName",
          "userProfilePic",
        ],
      },
    ],
    order: [["sentAt", "ASC"]],
  });
};

const markMessagesAsRead = async (conversationId, userId) => {
  console.log(conversationId, userId);

  await Message.update(
    { isRead: true },
    { where: { conversationId, receiverId: userId, isRead: false } }
  );
};

module.exports = { getUserChats, sendMessage, getMessages, markMessagesAsRead };
