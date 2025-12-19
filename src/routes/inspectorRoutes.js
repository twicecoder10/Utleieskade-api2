const express = require("express");
const inspectorController = require("../controllers/inspectorController");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/roleMiddleware");
const {
  inspectorValidationRules,
} = require("../validators/inspectorValidator");
const { validate } = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Inspectors
 *   description: Inspector management
 */

/**
 * @swagger
 * /inspectors/createInspector:
 *   post:
 *     summary: Create a new inspector
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Allows an admin to create a new inspector.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userFirstName:
 *                 type: string
 *                 example: "Maxwell"
 *               userLastName:
 *                 type: string
 *                 example: "James"
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 example: "maxwelljames@gmail.com"
 *               userPhone:
 *                 type: string
 *                 example: "+442838484802"
 *               userCity:
 *                 type: string
 *                 example: "London"
 *               userPostcode:
 *                 type: string
 *                 example: "23493"
 *               userAddress:
 *                 type: string
 *                 example: "14B James Park"
 *               userCountry:
 *                 type: string
 *                 example: "United Kingdom"
 *               userGender:
 *                 type: string
 *                 example: "Male"
 *               inspectorExpertiseCodes:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: "List of inspector expertise codes"
 *                 example: [101, 102, 103]
 *     responses:
 *       201:
 *         description: Inspector added successfully
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Only admins can perform this action
 *       500:
 *         description: Internal server error
 */
router.post(
  "/createInspector",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  inspectorValidationRules(),
  validate,
  inspectorController.addInspector
);

/**
 * @swagger
 * /inspectors/dashboard:
 *   get:
 *     summary: Fetch inspector dashboard data
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Get the data for the inspector's dashboard.
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.getTenantDashboard
);

/**
 * @swagger
 * /inspectors/getInspector/{inspectorId}:
 *   get:
 *     summary: Fetch inspector details by ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Retrieve the details of a specific inspector by their ID.
 *     parameters:
 *       - in: path
 *         name: inspectorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the inspector
 *     responses:
 *       200:
 *         description: Inspector details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Inspector details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     inspectorId:
 *                       type: string
 *                       example: "2345SD"
 *                     firstName:
 *                       type: string
 *                       example: "Maxwell"
 *                     lastName:
 *                       type: string
 *                       example: "James"
 *                     email:
 *                       type: string
 *                       example: "maxwelljames@gmail.com"
 *                     phone:
 *                       type: string
 *                       example: "+442838484802"
 *                     city:
 *                       type: string
 *                       example: "London"
 *                     address:
 *                       type: string
 *                       example: "14B James Park"
 *                     postcode:
 *                       type: string
 *                       example: "23493"
 *                     county:
 *                       type: string
 *                       example: "United Kingdom"
 *                     gender:
 *                       type: string
 *                       example: "Male"
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       example: "1986-05-12"
 *                     dateRegistered:
 *                       type: string
 *                       format: date
 *                       example: "2025-03-29"
 *       404:
 *         description: Inspector not found
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getInspector/:inspectorId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  inspectorController.getInspectorById
);

/**
 * @swagger
 * /inspectors/allInspectors:
 *   get:
 *     summary: Fetch all inspectors with pagination & search
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Retrieve a list of all inspectors with pagination and search functionality.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search inspectors by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of inspectors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Inspectors retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     inspectors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           inspectorId:
 *                             type: string
 *                             example: "2345SD"
 *                           name:
 *                             type: string
 *                             example: "Maxwell James"
 *                           email:
 *                             type: string
 *                             example: "maxwelljames@gmail.com"
 *                           phone:
 *                             type: string
 *                             example: "+442838484802"
 *                           city:
 *                             type: string
 *                             example: "London"
 *                           address:
 *                             type: string
 *                             example: "14B James Park"
 *                           postcode:
 *                             type: string
 *                             example: "23493"
 *                           country:
 *                             type: string
 *                             example: "United Kingdom"
 *                     totalInspectors:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Internal server error
 */
router.get(
  "/allInspectors",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  inspectorController.getAllInspectors
);

/**
 * @swagger
 * /inspectors/getCases:
 *   get:
 *     summary: Retrieve all inspector cases with pagination, sorting & search
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
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
 *         description: A list of inspector cases with pagination.
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
  authorizeRoles("inspector"),
  inspectorController.getInspectorCases
);

// Alias for /inspectors/cases/available (used by frontend)
router.get(
  "/cases/available",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.getInspectorCases
);

/**
 * @swagger
 * /inspectors/export:
 *   get:
 *     summary: Export list of inspectors as CSV or PDF
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Export all inspectors in CSV or PDF format.
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *         required: true
 *         description: Format of the exported file (csv or pdf)
 *     responses:
 *       200:
 *         description: Inspectors exported successfully
 *       404:
 *         description: No inspectors found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/export",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  inspectorController.exportInspectors
);

/**
 * @swagger
 * /inspectors/deactivate/{inspectorId}:
 *   patch:
 *     summary: Set inspector status to inactive
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Deactivate an inspector by setting their status to inactive.
 *     parameters:
 *       - in: path
 *         name: inspectorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the inspector
 *     responses:
 *       200:
 *         description: Inspector deactivated successfully
 *       404:
 *         description: Inspector not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/deactivate/:inspectorId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  inspectorController.deactivateInspector
);

/**
 * @swagger
 * /inspectors/earnings:
 *   get:
 *     summary: Get inspector earnings and payout history
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     responses:
 *       200:
 *         description: Inspector earnings and payout history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBalance:
 *                   type: number
 *                   example: 20340.00
 *                 payoutHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "21st May 2025"
 *                       referenceNumber:
 *                         type: string
 *                         example: "REF20234-234"
 *                       cases:
 *                         type: integer
 *                         example: 24
 *                       amount:
 *                         type: number
 *                         example: -24000.00
 *                       status:
 *                         type: string
 *                         example: "Pending"
 *       500:
 *         description: Internal server error
 */
router.get(
  "/earnings",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.getInspectorEarnings
);

/**
 * @swagger
 * /inspectors/request-payout:
 *   post:
 *     summary: Request a payout for the inspector's pending balance
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 20340.00
 *               userPassword:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       200:
 *         description: Payout request successful
 *       400:
 *         description: Invalid request (wrong amount or incorrect password)
 *       401:
 *         description: Unauthorized - Inspector not authenticated
 *       500:
 *         description: Internal server error
 */
router.post(
  "/request-payout",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.requestPayout
);

/**
 * @swagger
 * /inspectors/settings:
 *   get:
 *     summary: Get inspector settings
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Retrieve the current settings of an inspector.
 *     responses:
 *       200:
 *         description: Inspector settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   type: object
 *                   properties:
 *                     userFirstName:
 *                       type: string
 *                     userLastName:
 *                       type: string
 *                     userEmail:
 *                       type: string
 *                     userPhone:
 *                       type: string
 *                     expertise:
 *                       type: string
 *                     language:
 *                       type: string
 *                     userAddress:
 *                       type: string
 *                     userPostcode:
 *                       type: string
 *                     userCountry:
 *                       type: string
 *                 notifications:
 *                   type: object
 *                   properties:
 *                     deadlineNotifications:
 *                       type: boolean
 *                     newCaseAlerts:
 *                       type: boolean
 *                     tenantsUpdates:
 *                       type: boolean
 *                     messageNotifications:
 *                       type: boolean
 *                 payment:
 *                   type: object
 *                   properties:
 *                     bankName:
 *                       type: string
 *                     accountNumber:
 *                       type: string
 *                     userFirstName:
 *                       type: string
 *                     userLastName:
 *                       type: string
 *                 privacySecurity:
 *                   type: object
 *                   properties:
 *                     mfaEnabled:
 *                       type: boolean
 *                     pauseMode:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get(
  "/settings",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.getInspectorSettings
);

/**
 * @swagger
 * /inspectors/settings:
 *   put:
 *     summary: Update inspector settings
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Allows an inspector to update their settings.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *                 properties:
 *                   deadlineNotifications:
 *                     type: boolean
 *                   newCaseAlerts:
 *                     type: boolean
 *                   tenantsUpdates:
 *                     type: boolean
 *                   messageNotifications:
 *                     type: boolean
 *               payment:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *               expertises:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: "List of inspector expertise codes"
 *                 example: [101, 102, 103]
 *               privacySecurity:
 *                 type: object
 *                 properties:
 *                   mfaEnabled:
 *                     type: boolean
 *                   pauseMode:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Inspector settings updated successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.put(
  "/settings",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.updateInspectorSettings
);

/**
 * @swagger
 * /inspectors/delete/my-account:
 *   delete:
 *     summary: Delete inspector account
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     responses:
 *       200:
 *         description: Inspector deleted successfully
 *       404:
 *         description: Inspector not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/delete/my-account",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.deleteInspector
);

/**
 * @swagger
 * /inspectors/actions/logs:
 *   get:
 *     summary: Get inspector action logs
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: caseId
 *         schema:
 *           type: string
 *         description: Filter by case ID
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
 *     responses:
 *       200:
 *         description: Action logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
const actionLogController = require("../controllers/actionLogController");
router.get(
  "/actions/logs",
  authMiddleware,
  authorizeRoles("inspector"),
  actionLogController.getActionLogs
);

/**
 * @swagger
 * /inspectors/reports:
 *   get:
 *     summary: Get inspector reports
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
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
 *         description: Number of reports per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/reports",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.getInspectorReports
);

/**
 * @swagger
 * /inspectors/cases/{caseId}/timer/start:
 *   post:
 *     summary: Start work timer for a case
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID
 *     responses:
 *       200:
 *         description: Timer started successfully
 *       400:
 *         description: Timer is already running
 *       404:
 *         description: Case not found or not assigned
 *       500:
 *         description: Internal server error
 */
const timerController = require("../controllers/timerController");
router.post(
  "/cases/:caseId/timer/start",
  authMiddleware,
  authorizeRoles("inspector"),
  timerController.startTimer
);

/**
 * @swagger
 * /inspectors/cases/{caseId}/timer/stop:
 *   post:
 *     summary: Stop work timer for a case
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID
 *     responses:
 *       200:
 *         description: Timer stopped successfully
 *       404:
 *         description: No active timer found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/cases/:caseId/timer/stop",
  authMiddleware,
  authorizeRoles("inspector"),
  timerController.stopTimer
);

/**
 * @swagger
 * /inspectors/cases/{caseId}/timer:
 *   get:
 *     summary: Get work timer data for a case
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID
 *     responses:
 *       200:
 *         description: Timer data retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  "/cases/:caseId/timer",
  authMiddleware,
  authorizeRoles("inspector"),
  timerController.getTimer
);

/**
 * @swagger
 * /inspectors/password:
 *   put:
 *     summary: Change inspector password
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     description: Allows an inspector to change their password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password and new password are required, or new password is too short
 *       403:
 *         description: Current password is incorrect
 *       404:
 *         description: Inspector not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/password",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.changePassword
);

module.exports = router;
