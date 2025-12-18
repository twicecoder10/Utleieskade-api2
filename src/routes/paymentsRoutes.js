const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middlewares/roleMiddleware");
const paymentsController = require("../controllers/paymentsController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management
 */

/**
 * @swagger
 * /payments/allPayments:
 *   get:
 *     summary: Retrieve all payments with pagination, search & filter
 *     security:
 *       - BearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search payments by inspector name or email.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processed, rejected]
 *         description: Filter payments by status.
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
 *         description: Number of payments per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: "paymentDate"
 *         description: Field to sort by (e.g., paymentDate, pendingAmount).
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: "desc"
 *         description: Sort order (asc or desc).
 *     responses:
 *       200:
 *         description: A list of payments.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/allPayments",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  paymentsController.getPayments
);

/**
 * @swagger
 * /payments/getPaymentDetails/{paymentId}:
 *   get:
 *     summary: Get payment details by ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the payment
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getPaymentDetails/:paymentId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  paymentsController.getPaymentById
);

/**
 * @swagger
 * /payments/approve/{paymentId}:
 *   patch:
 *     summary: Approve a payout
 *     security:
 *       - BearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the payment
 *     responses:
 *       200:
 *         description: Payment approved successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/approve/:paymentId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  paymentsController.approvePayment
);

/**
 * @swagger
 * /payments/reject/{paymentId}:
 *   patch:
 *     summary: Reject a payout with reason
 *     security:
 *       - BearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 example: "Incorrect bank details provided."
 *     responses:
 *       200:
 *         description: Payment rejected successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/reject/:paymentId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  paymentsController.rejectPayment
);

/**
 * @swagger
 * /payments/report/{paymentId}:
 *   get:
 *     summary: Generate a payment report by ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the payment
 *     responses:
 *       200:
 *         description: Payment report generated successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/report/:paymentId",
  // authMiddleware,
  // authorizeRoles("admin", "sub-admin"),
  paymentsController.generatePaymentReport
);

/**
 * @swagger
 * /payments/create-intent:
 *   post:
 *     summary: Create a Stripe payment intent for tenant payment
 *     security:
 *       - BearerAuth: []
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               caseData:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid payment amount
 *       500:
 *         description: Internal server error
 */
router.post(
  "/create-intent",
  authMiddleware,
  paymentsController.createPaymentIntent
);

/**
 * @swagger
 * /payments/confirm:
 *   post:
 *     summary: Confirm payment and create case
 *     security:
 *       - BearerAuth: []
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *               caseData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment confirmed and case created successfully
 *       400:
 *         description: Payment not completed or already processed
 *       500:
 *         description: Internal server error
 */
router.post(
  "/confirm",
  authMiddleware,
  paymentsController.confirmPayment
);

module.exports = router;
