const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const refundController = require("../controllers/refundController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Refunds
 *   description: Refund management
 */

/**
 * @swagger
 * /refunds/getRefunds:
 *   get:
 *     summary: Retrieve all refunds with pagination, sorting & search
 *     security:
 *       - BearerAuth: []
 *     tags: [Refunds]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search refunds by case ID or customer name.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter refunds by status (pending, processed, rejected).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of refunds per page.
 *     responses:
 *       200:
 *         description: A list of refunds retrieved successfully.
 *       500:
 *         description: Internal server error.
 */
router.get("/getRefunds", authMiddleware, isAdmin, refundController.getRefunds);

/**
 * @swagger
 * /refunds/getRefund/{refundId}:
 *   get:
 *     summary: Retrieve refund details by ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Refunds]
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the refund.
 *     responses:
 *       200:
 *         description: Refund details retrieved successfully.
 *       404:
 *         description: Refund not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/getRefund/:refundId", authMiddleware, isAdmin, refundController.getRefundById);

/**
 * @swagger
 * /refunds/approve/{refundId}:
 *   patch:
 *     summary: Approve a refund request
 *     security:
 *       - BearerAuth: []
 *     tags: [Refunds]
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the refund.
 *     responses:
 *       200:
 *         description: Refund approved successfully.
 *       404:
 *         description: Refund not found.
 *       500:
 *         description: Internal server error.
 */
router.patch("/approve/:refundId", authMiddleware, isAdmin, refundController.approveRefund);

/**
 * @swagger
 * /refunds/reject/{refundId}:
 *   patch:
 *     summary: Reject a refund request
 *     security:
 *       - BearerAuth: []
 *     tags: [Refunds]
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the refund.
 *     responses:
 *       200:
 *         description: Refund rejected successfully.
 *       404:
 *         description: Refund not found.
 *       500:
 *         description: Internal server error.
 */
router.patch("/reject/:refundId", authMiddleware, isAdmin, refundController.rejectRefund);

module.exports = router;