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
 * /inspectors/earnings/report:
 *   post:
 *     summary: Request earnings report to be sent via email
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 12
 *                 description: Month number (1-12)
 *               year:
 *                 type: integer
 *                 example: 2024
 *                 description: Year
 *     responses:
 *       200:
 *         description: Earnings report sent successfully
 *       400:
 *         description: Invalid request (missing or invalid month/year)
 *       401:
 *         description: Unauthorized - Inspector not authenticated
 *       500:
 *         description: Internal server error
 */
router.post(
  "/earnings/report",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.sendEarningsReport
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

/**
 * @swagger
 * /inspectors/cases/{caseId}/claim:
 *   post:
 *     summary: Claim a case (assign to self)
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID to claim
 *     responses:
 *       200:
 *         description: Case claimed successfully
 *       400:
 *         description: Case already claimed
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
const caseController = require("../controllers/caseController");
router.post(
  "/cases/:caseId/claim",
  authMiddleware,
  authorizeRoles("inspector"),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { id: inspectorId } = req.user;

      const caseService = require("../services/caseService");
      const updatedCase = await caseService.assignCase(caseId, inspectorId);

      if (!updatedCase) {
        const responseHandler = require("../utils/responseHandler");
        responseHandler.setError(404, "Case or inspector not found");
        return responseHandler.send(res);
      }

      // Log the action
      await caseService.logCaseEvent(
        caseId,
        "inspectorAssigned",
        `Case claimed by inspector`
      );

      // Log to ActionLog for inspector action logs
      const { logInspectorAction } = require("../utils/logInspectorAction");
      await logInspectorAction(
        inspectorId,
        "case_claimed",
        `Case ${caseId} claimed by inspector`,
        caseId
      );

      const responseHandler = require("../utils/responseHandler");
      responseHandler.setSuccess(200, "Case claimed successfully", updatedCase);
      return responseHandler.send(res);
    } catch (error) {
      const responseHandler = require("../utils/responseHandler");
      if (error.message && error.message.includes("already claimed")) {
        responseHandler.setError(400, error.message);
      } else {
        responseHandler.setError(500, error.message);
      }
      return responseHandler.send(res);
    }
  }
);

/**
 * @swagger
 * /inspectors/cases/{caseId}/cancel:
 *   post:
 *     summary: Cancel a case
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID to cancel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cancellationReason
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 example: "Unable to complete due to scheduling conflicts"
 *     responses:
 *       200:
 *         description: Case cancelled successfully
 *       400:
 *         description: Cancellation reason required
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/cases/:caseId/cancel",
  authMiddleware,
  authorizeRoles("inspector"),
  caseController.cancelCase
);

/**
 * @swagger
 * /inspectors/cases/{caseId}/hold:
 *   put:
 *     summary: Put a case on hold
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID to put on hold
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holdReason
 *             properties:
 *               holdReason:
 *                 type: string
 *                 example: "Waiting for tenant availability"
 *     responses:
 *       200:
 *         description: Case put on hold successfully
 *       400:
 *         description: Hold reason required
 *       404:
 *         description: Case not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/cases/:caseId/hold",
  authMiddleware,
  authorizeRoles("inspector"),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { holdReason } = req.body;
      const { id: inspectorId } = req.user;

      if (!holdReason) {
        const responseHandler = require("../utils/responseHandler");
        responseHandler.setError(400, "Hold reason is required");
        return responseHandler.send(res);
      }

      // Update case status to on-hold
      const caseService = require("../services/caseService");
      const result = await caseService.updateCaseStatus(caseId, "on-hold");

      if (!result) {
        const responseHandler = require("../utils/responseHandler");
        responseHandler.setError(404, "Case not found");
        return responseHandler.send(res);
      }

      // Log the action
      await caseService.logCaseEvent(
        caseId,
        "caseOnHold",
        `Case put on hold: ${holdReason}`
      );

      // Log to ActionLog for inspector action logs
      const { logInspectorAction } = require("../utils/logInspectorAction");
      await logInspectorAction(
        inspectorId,
        "case_on_hold",
        `Case ${caseId} put on hold: ${holdReason}`,
        caseId,
        { holdReason }
      );

      const responseHandler = require("../utils/responseHandler");
      responseHandler.setSuccess(200, "Case put on hold successfully");
      return responseHandler.send(res);
    } catch (error) {
      const responseHandler = require("../utils/responseHandler");
      responseHandler.setError(500, error.message);
      return responseHandler.send(res);
    }
  }
);

/**
 * @swagger
 * /inspectors/cases/{caseId}/release:
 *   put:
 *     summary: Release a case (unclaim it)
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The case ID to release
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
router.put(
  "/cases/:caseId/release",
  authMiddleware,
  authorizeRoles("inspector"),
  caseController.releaseCase
);

/**
 * @swagger
 * /inspectors/cases/{caseId}/report/preview:
 *   get:
 *     summary: Get report preview for a case
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
 *         description: Report preview retrieved successfully
 *       404:
 *         description: Case or report not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/cases/:caseId/report/preview",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.getReportPreview
);

/**
 * @swagger
 * /inspectors/reports/{reportId}:
 *   delete:
 *     summary: Delete a report
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: The report ID to delete
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/reports/:reportId",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.deleteReport
);

/**
 * @swagger
 * /inspectors/reports/{reportId}/pdf:
 *   get:
 *     summary: Get report PDF
 *     security:
 *       - BearerAuth: []
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: The report ID
 *     responses:
 *       200:
 *         description: PDF retrieved successfully
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/reports/:reportId/pdf",
  authMiddleware,
  authorizeRoles("inspector"),
  inspectorController.getReportPdf
);

module.exports = router;
