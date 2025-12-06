const express = require("express");
const notificationController = require("../controllers/notificationController");
const { authMiddleware, authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of notifications per page
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, notificationController.getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/unread-count", authMiddleware, notificationController.getUnreadNotificationCount);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch("/:notificationId/read", authMiddleware, notificationController.markNotificationAsRead);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch("/mark-all-read", authMiddleware, notificationController.markAllNotificationsAsRead);

/**
 * @swagger
 * /notifications/system:
 *   post:
 *     summary: Create system notification
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     responses:
 *       201:
 *         description: System notification created
 *       401:
 *         description: Unauthorized
 */
router.post("/system", authMiddleware, authorizeRoles("admin", "sub-admin"), notificationController.createSystemNotification);

/**
 * @swagger
 * /notifications/mass:
 *   post:
 *     summary: Create mass notification
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     responses:
 *       201:
 *         description: Mass notification created
 *       401:
 *         description: Unauthorized
 */
router.post("/mass", authMiddleware, authorizeRoles("admin", "sub-admin"), notificationController.createMassNotification);

/**
 * @swagger
 * /notifications/check-overdue:
 *   post:
 *     summary: Check overdue cases
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Overdue cases checked
 *       401:
 *         description: Unauthorized
 */
router.post("/check-overdue", authMiddleware, authorizeRoles("admin", "sub-admin"), notificationController.checkOverdueCases);

/**
 * @swagger
 * /notifications/check-cancellations:
 *   post:
 *     summary: Check frequent cancellations
 *     security:
 *       - BearerAuth: []
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *         description: Cancellation threshold
 *     responses:
 *       200:
 *         description: Cancellations checked
 *       401:
 *         description: Unauthorized
 */
router.post("/check-cancellations", authMiddleware, authorizeRoles("admin", "sub-admin"), notificationController.checkFrequentCancellations);

module.exports = router;

