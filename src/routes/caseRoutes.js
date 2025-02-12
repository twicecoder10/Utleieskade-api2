const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const caseController = require("../controllers/caseController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cases
 *   description: Case management
 */

/**
 * @swagger
 * /cases/getCases:
 *   get:
 *     summary: Retrieve all cases with pagination, sorting & search
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search cases by description.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter cases by status (open, closed).
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
 *         description: Number of cases per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: "createdAt"
 *         description: Field to sort by (e.g., createdAt, caseStatus).
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: "desc"
 *         description: Sort order (asc or desc).
 *     responses:
 *       200:
 *         description: A list of cases with pagination.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       caseID:
 *                         type: string
 *                         example: "1234"
 *                       caseDescription:
 *                         type: string
 *                         example: "Water leakage issue"
 *                       status:
 *                         type: string
 *                         example: "open"
 *                       tenant:
 *                         type: object
 *                         properties:
 *                           tenantId:
 *                             type: string
 *                             example: "5678"
 *                           userFirstName:
 *                             type: string
 *                             example: "John"
 *                           userLastName:
 *                             type: string
 *                             example: "Doe"
 *                       inspector:
 *                         type: object
 *                         properties:
 *                           inspectorId:
 *                             type: string
 *                             example: "9876"
 *                           userFirstName:
 *                             type: string
 *                             example: "Alice"
 *                           userLastName:
 *                             type: string
 *                             example: "Smith"
 *                 totalCases:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/getCases",
  authMiddleware,
  isAdmin,
  caseController.getCasesController
);

/**
 * @swagger
 * /cases/getCase/{caseId}:
 *   get:
 *     summary: Get case details by ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the case
 *     responses:
 *       200:
 *         description: Case details retrieved successfully
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getCase/:caseId",
  authMiddleware,
  isAdmin,
  caseController.getCaseDetails
);

/**
 * @swagger
 * /cases/{caseId}/cancel:
 *   patch:
 *     summary: Cancel a case
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the case
 *     responses:
 *       200:
 *         description: Case cancelled successfully
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:caseId/cancel",
  authMiddleware,
  isAdmin,
  caseController.cancelCase
);

/**
 * @swagger
 * /cases/{caseId}/assign/{inspectorId}:
 *   patch:
 *     summary: Assign a case to a an inspector
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the case
 *       - in: path
 *         name: inspectorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the inspector
 *     responses:
 *       200:
 *         description: Inspector assigned successfully
 *       404:
 *         description: Case or inspector not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:caseId/assign/:inspectorId",
  authMiddleware,
  isAdmin,
  caseController.assignCase
);

/**
 * @swagger
 * /cases/{caseId}/timeline:
 *   get:
 *     summary: Get case timeline by ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the case
 *     responses:
 *       200:
 *         description: Case timeline retrieved successfully
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:caseId/timeline",
  authMiddleware,
  isAdmin,
  caseController.getCaseTimeline
);

module.exports = router;
