const express = require("express");
const settingsController = require("../controllers/settingsController");
const { authMiddleware, authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * /settings/platform:
 *   get:
 *     summary: Get platform settings
 *     security:
 *       - BearerAuth: []
 *     tags: [Settings]
 *     description: Retrieve the current platform settings.
 *     responses:
 *       200:
 *         description: Platform settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/platform",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  settingsController.getPlatformSettings
);

/**
 * @swagger
 * /settings/platform:
 *   patch:
 *     summary: Update platform settings
 *     security:
 *       - BearerAuth: []
 *     tags: [Settings]
 *     description: Update platform settings (admin only).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultLanguage:
 *                 type: string
 *                 enum: [en, no, nb]
 *               paymentThreshold:
 *                 type: number
 *               refundPolicyDays:
 *                 type: integer
 *               hasteCaseFee:
 *                 type: number
 *               hasteCaseDeadlineDays:
 *                 type: integer
 *               normalCaseDeadlineDays:
 *                 type: integer
 *               gdprEnabled:
 *                 type: boolean
 *               dataRetentionDays:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Platform settings updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/platform",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  settingsController.updatePlatformSettings
);

/**
 * @swagger
 * /settings/data-deletion:
 *   post:
 *     summary: Process data deletion request
 *     security:
 *       - BearerAuth: []
 *     tags: [Settings]
 *     description: Process a GDPR data deletion request (admin only).
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
 *     responses:
 *       200:
 *         description: Data deletion processed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/data-deletion",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  settingsController.processDataDeletion
);

/**
 * @swagger
 * /settings/data-logs:
 *   get:
 *     summary: Get data logs
 *     security:
 *       - BearerAuth: []
 *     tags: [Settings]
 *     description: Retrieve data logs for audit purposes (admin only).
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Data logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/data-logs",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  settingsController.getDataLogs
);

module.exports = router;

