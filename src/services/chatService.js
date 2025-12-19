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

const getAdminChats = async (adminId) => {
  return await Conversation.findAll({
    where: {
      [Op.or]: [{ userOne: adminId }, { userTwo: adminId }],
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
          "userType",
          "userEmail",
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
          "userType",
          "userEmail",
        ],
      },
    ],
    order: [["lastMessageTimestamp", "DESC"]],
  });
};

const getChattableUsers = async (adminId, search = "") => {
  const whereClause = {
    userId: { [Op.ne]: adminId }, // Exclude admin
    userType: { [Op.in]: ["inspector", "tenant", "landlord"] }, // Only these user types
  };

  if (search) {
    whereClause[Op.or] = [
      { userFirstName: { [Op.like]: `%${search}%` } },
      { userLastName: { [Op.like]: `%${search}%` } },
      { userEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  return await User.findAll({
    where: whereClause,
    attributes: [
      "userId",
      "userFirstName",
      "userLastName",
      "userEmail",
      "userProfilePic",
      "userType",
    ],
    order: [["userFirstName", "ASC"]],
  });
};

const getCommunicationHistory = async (adminId, userId) => {
  // Find or get the conversation between admin and user
  const conversation = await Conversation.findOne({
    where: {
      [Op.or]: [
        { userOne: adminId, userTwo: userId },
        { userOne: userId, userTwo: adminId },
      ],
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
          "userType",
          "userEmail",
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
          "userType",
          "userEmail",
        ],
      },
    ],
  });

  // Get all messages for this conversation
  const messages = conversation
    ? await Message.findAll({
        where: { conversationId: conversation.conversationId },
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
        ],
        order: [["sentAt", "ASC"]],
      })
    : [];

  return {
    conversation: conversation || null,
    messages: messages || [],
  };
};

const getCaseConversation = async (caseId, inspectorId) => {
  const { Case } = require("../models");
  
  // Get the case to find the tenant
  const caseInstance = await Case.findOne({
    where: { caseId },
    include: [
      {
        model: User,
        as: "tenant",
        attributes: ["userId", "userFirstName", "userLastName", "userProfilePic"],
        required: false,
      },
    ],
  });

  if (!caseInstance) {
    throw new Error("Case not found");
  }

  const tenantId = caseInstance.userId;
  
  if (!tenantId) {
    throw new Error("Tenant not found for this case");
  }

  // Find or create conversation between inspector and tenant
  const conversation = await findOrCreateConversation(inspectorId, tenantId);

  // Get all messages for this conversation
  const messages = await Message.findAll({
    where: { conversationId: conversation.conversationId },
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

  return {
    conversation,
    messages: messages || [],
    tenant: caseInstance.tenant,
  };
};

module.exports = {
  getUserChats,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getAdminChats,
  getChattableUsers,
  getCommunicationHistory,
  getCaseConversation,
};
