const express = require("express");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/roleMiddleware");
const caseController = require("../controllers/caseController");
const { caseValidationRules } = require("../validators/caseValidator");
const {
  caseAssessmentValidationRules,
} = require("../validators/caseAssessmentValidator");
const {
  extendCaseDeadlineValidationRules,
} = require("../validators/extendCaseValidator");
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
router.get("/getCase/:caseId", authMiddleware, caseController.getCaseDetails);

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
 * /cases/{caseId}/extend-deadline:
 *   patch:
 *     summary: Extend the deadline of a case
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     description: Allows an inspector or admin to extend the deadline for a case.
 *     parameters:
 *       - in: path
 *         name: caseId
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique identifier of the case
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newDeadline
 *             properties:
 *               newDeadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-04-01T14:30:00Z"
 *     responses:
 *       200:
 *         description: Case deadline extended successfully
 *       400:
 *         description: Invalid input (e.g. no deadline provided)
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:caseId/extend-deadline",
  authMiddleware,
  authorizeRoles("inspector", "admin", "sub-admin"),
  extendCaseDeadlineValidationRules(),
  validate,
  caseController.extendCaseDeadline
);

/**
 * @swagger
 * /cases/updateStatus/{caseId}/to/{status}:
 *   patch:
 *     summary: Update a case status
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
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: New status of the case
 *     responses:
 *       200:
 *         description: Case status updated successfully
 *       404:
 *         description: Case not found
 *       400:
 *         description: Status is required
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/updateStatus/:caseId/to/:status",
  authMiddleware,
  authorizeRoles("admin", "sub-admin", "inspector"),
  caseController.updateCaseStatus
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
  authorizeRoles("admin", "sub-admin", "inspector"),
  caseController.assignCase
);

/**
 * @swagger
 * /cases/release/{caseId}:
 *   patch:
 *     summary: Release a case (unclaim it)
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
 *         description: Case released successfully
 *       403:
 *         description: You can only release cases that you have claimed
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/release/:caseId",
  authMiddleware,
  authorizeRoles("inspector"),
  caseController.releaseCase
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
  authorizeRoles("admin", "sub-admin", "inspector"),
  caseController.getCaseTimeline
);

/**
 * @swagger
 * /cases/report-assessment:
 *   post:
 *     summary: Upload a case assessment
 *     security:
 *       - BearerAuth: []
 *     tags: [Cases]
 *     description: Allows an inspector to report a case assessment with multiple photos, items, and a summary.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caseId:
 *                 type: string
 *                 example: "8d55184c-2039-4d58-9f6f-3b2452589aab"
 *               reportDescription:
 *                 type: string
 *                 example: "Multiple damages across the apartment"
 *               photos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     photoUrl:
 *                       type: string
 *                       example: "https://example.com/photo1.jpg"
 *               items:
 *                 type: array
 *                 description: List of material and labor assessment items
 *                 items:
 *                   type: object
 *                   properties:
 *                     item:
 *                       type: string
 *                       example: "Paint walls"
 *                     quantity:
 *                       type: integer
 *                       example: 5
 *                     unitPrice:
 *                       type: number
 *                       example: 100.0
 *                     hours:
 *                       type: integer
 *                       example: 2
 *                     hourlyRate:
 *                       type: number
 *                       example: 50.0
 *                     sumMaterial:
 *                       type: number
 *                       example: 500.0
 *                     sumWork:
 *                       type: number
 *                       example: 100.0
 *                     sumPost:
 *                       type: number
 *                       example: 600.0
 *               summary:
 *                 type: object
 *                 properties:
 *                   totalHours:
 *                     type: integer
 *                     example: 20
 *                   totalSumMaterials:
 *                     type: number
 *                     example: 1000.0
 *                   totalSumLabor:
 *                     type: number
 *                     example: 500.0
 *                   sumExclVAT:
 *                     type: number
 *                     example: 1500.0
 *                   vat:
 *                     type: number
 *                     example: 112.5
 *                   sumInclVAT:
 *                     type: number
 *                     example: 1612.5
 *                   total:
 *                     type: number
 *                     example: 2000.0
 *     responses:
 *       201:
 *         description: Assessment reported successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post(
  "/report-assessment",
  authMiddleware,
  authorizeRoles("inspector"),
  caseAssessmentValidationRules(),
  validate,
  caseController.reportAssessment
);

module.exports = router;
