const express = require("express");
const actionLogController = require("../controllers/actionLogController");
const { authMiddleware, authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Action Logs
 *   description: Action log management
 */

/**
 * @swagger
 * /action-logs:
 *   get:
 *     summary: Get action logs
 *     security:
 *       - BearerAuth: []
 *     tags: [Action Logs]
 *     parameters:
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID (inspector or admin)
 *       - in: query
 *         name: inspectorId
 *         schema:
 *           type: string
 *         description: Filter by inspector ID
 *       - in: query
 *         name: caseId
 *         schema:
 *           type: string
 *         description: Filter by case ID
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Filter by admin ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Action logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, authorizeRoles("admin", "sub-admin"), actionLogController.getActionLogs);

/**
 * @swagger
 * /action-logs/action-types:
 *   get:
 *     summary: Get action types
 *     security:
 *       - BearerAuth: []
 *     tags: [Action Logs]
 *     responses:
 *       200:
 *         description: Action types retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/action-types", authMiddleware, authorizeRoles("admin", "sub-admin"), actionLogController.getActionTypes);

module.exports = router;

