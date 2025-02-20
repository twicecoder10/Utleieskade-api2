const express = require("express");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/roleMiddleware");
const caseController = require("../controllers/caseController");
const { caseValidationRules } = require("../validators/caseValidator");
const { validate } = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cases
 *   description: Case management
 */

/**
 * @swagger
 * /cases/report:
 *   post:
 *     summary: Submit a new case with multiple damages
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     description: Allows a tenant to report multiple damages under a single case, with each damage having its own photos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *                 example: "8d55184c-2039-4d58-9f6f-3b2452589aab"
 *               caseDescription:
 *                 type: string
 *                 example: "Multiple damages across the apartment"
 *               caseUrgencyLevel:
 *                 type: string
 *                 example: "high"
 *               buildingNumber:
 *                 type: string
 *                 example: "Building A"
 *               damages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     damageLocation:
 *                       type: string
 *                       example: "Kitchen"
 *                     damageType:
 *                       type: string
 *                       example: "Water Leak"
 *                     damageDescription:
 *                       type: string
 *                       example: "Leak from the kitchen sink causing water damage to the floor."
 *                     damageDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-06-01"
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           photoType:
 *                             type: string
 *                             example: "overview"
 *                           photoUrl:
 *                             type: string
 *                             example: "https://example.com/photos/damage1.jpg"
 *     responses:
 *       201:
 *         description: Case created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post(
  "/report",
  authMiddleware,
  authorizeRoles("tenant"),
  caseValidationRules(),
  validate,
  caseController.reportDamage
);

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
  authorizeRoles("admin", "sub-admin"),
  caseController.getCases
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
  caseController.getCaseDetails
);

/**
 * @swagger
 * /cases/cancel/{caseId}:
 *   patch:
 *     summary: Cancel a case with a reason
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 example: "Tenant requested to withdraw the case."
 *     responses:
 *       200:
 *         description: Case cancelled successfully
 *       404:
 *         description: Case not found
 *       400:
 *         description: Cancellation reason required
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/cancel/:caseId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  caseController.cancelCase
);

/**
 * @swagger
 * /cases/assign/{caseId}/to/{inspectorId}:
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
  "/assign/:caseId/to/:inspectorId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  caseController.assignCase
);

/**
 * @swagger
 * /cases/getTimeline/{caseId}:
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
  "/getTimeline/:caseId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  caseController.getCaseTimeline
);

module.exports = router;
