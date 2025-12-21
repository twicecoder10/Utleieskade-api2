const express = require("express");
const chatController = require("../controllers/chatController");
const { authMiddleware, authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat and messaging functionalities
 */

/**
 * @swagger
 * /chats/fetch-chats:
 *   get:
 *     summary: Fetch user conversations
 *     security:
 *       - BearerAuth: []
 *     tags: [Chat]
 *     description: Retrieves a list of conversations the user is part of.
 *     responses:
 *       200:
 *         description: List of conversations retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   conversationId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   lastMessage:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/fetch-chats", authMiddleware, chatController.getUserChats);

/**
 * @swagger
 * /chats/get-messages/{conversationId}:
 *   get:
 *     summary: Fetch messages from a conversation
 *     security:
 *       - BearerAuth: []
 *     tags: [Chat]
 *     description: Retrieves messages from a specific conversation.
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The conversation ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   messageId:
 *                     type: string
 *                   senderId:
 *                     type: string
 *                   receiverId:
 *                     type: string
 *                   messageText:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/get-messages/:conversationId",
  authMiddleware,
  chatController.getMessages
);

// Handle trailing slash case
router.get(
  "/get-messages/",
  authMiddleware,
  (req, res) => {
    const responseHandler = require("../utils/responseHandler");
    responseHandler.setError(400, "Conversation ID is required");
    return responseHandler.send(res);
  }
);

/**
 * @swagger
 * /chats/get-admin-chats:
 *   get:
 *     summary: Fetch admin conversations
 *     security:
 *       - BearerAuth: []
 *     tags: [Chat]
 *     description: Retrieves a list of conversations for admin users.
 *     responses:
 *       200:
 *         description: List of admin conversations retrieved successfully.
 *       401:
 *         description: Unauthorized
 */
router.get("/get-admin-chats", authMiddleware, chatController.getAdminChats);

/**
 * @swagger
 * /chats/get-chattable-users:
 *   get:
 *     summary: Get list of users admin can chat with
 *     security:
 *       - BearerAuth: []
 *     tags: [Chat]
 *     description: Retrieves a list of users (inspectors, tenants, landlords) that admin can start conversations with.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *     responses:
 *       200:
 *         description: List of chattable users retrieved successfully.
 *       401:
 *         description: Unauthorized
 */
router.get("/get-chattable-users", authMiddleware, chatController.getChattableUsers);

/**
 * @swagger
 * /chats/get-communication-history/{userId}:
 *   get:
 *     summary: Get communication history with a specific user
 *     security:
 *       - BearerAuth: []
 *     tags: [Chat]
 *     description: Retrieves the conversation and all messages between admin and a specific user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID to get communication history with
 *     responses:
 *       200:
 *         description: Communication history retrieved successfully.
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/get-communication-history/:userId",
  authMiddleware,
  chatController.getCommunicationHistory
);

// /**
//  * @swagger
//  * /chats/send-message:
//  *   post:
//  *     summary: Send a message
//  *     security:
//  *       - BearerAuth: []
//  *     tags: [Chat]
//  *     description: Send a message to another user.
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               receiverId:
//  *                 type: string
//  *                 description: ID of the user receiving the message
//  *               messageText:
//  *                 type: string
//  *                 description: The message text
//  *     responses:
//  *       201:
//  *         description: Message sent successfully.
//  *       400:
//  *         description: Bad request, missing fields
//  *       401:
//  *         description: Unauthorized
//  */
// router.post("/send-message", authMiddleware, chatController.sendMessage);

/**
 * @swagger
 * /chats/case/{caseId}/conversation:
 *   get:
 *     summary: Get or create conversation between inspector and tenant for a case
 *     security:
 *       - BearerAuth: []
 *     tags: [Chat]
 *     description: Retrieves or creates a conversation between the inspector and the tenant who created the case.
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/case/:caseId/conversation",
  authMiddleware,
  authorizeRoles("inspector"),
  chatController.getCaseConversation
);

/**
 * @swagger
 * /chats/find-or-create:
 *   post:
 *     summary: Find or create a conversation with a user
 *     security:
 *       - BearerAuth: []
 *     tags: [Chat]
 *     description: Finds an existing conversation or creates a new one between the current user and another user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to start a conversation with
 *     responses:
 *       200:
 *         description: Conversation found or created successfully
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/find-or-create",
  authMiddleware,
  chatController.findOrCreateConversation
);

module.exports = router;
