const express = require("express");
const adminController = require("../controllers/adminController.js");
const { adminValidationRules } = require("../validators/adminValidator.js");
const {
  subAdminValidationRules,
} = require("../validators/subAdminValidator.js");
const {
  updateInspectorByAdminValidation,
} = require("../validators/inspectorValidator.js");
const { validate } = require("../middlewares/validate");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/roleMiddleware.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Admin management
 */

/**
 * @swagger
 * /admins/signup:
 *   post:
 *     summary: Create a new admin user
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userFirstName:
 *                 type: string
 *                 example: "John"
 *               userLastName:
 *                 type: string
 *                 example: "Doe"
 *               userEmail:
 *                 type: string
 *                 example: "mail@mail.com"
 *               userPhone:
 *                 type: string
 *                 example: "+123456789"
 *               userPassword:
 *                 type: string
 *                 example: "securepassword"
 *               userCity:
 *                 type: string
 *                 example: "London"
 *               userPostcode:
 *                 type: string
 *                 example: "S12 2IS"
 *               userAddress:
 *                 type: string
 *                 example: "123 Main Street"
 *               userCountry:
 *                 type: string
 *                 example: "UK"
 *
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: The admin already exists!
 *       500:
 *         description: Internal server error
 */

router.post(
  "/signup",
  adminValidationRules(),
  validate,
  adminController.createAdmin
);

/**
 * @swagger
 * /admins/getAdmins:
 *   get:
 *     summary: Retrieve all sub-admins with pagination, sorting & search
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search admins by name or email.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter admins by status.
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
 *         description: Number of admins per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: "createdAt"
 *         description: Field to sort by (e.g., createdAt, status).
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: "desc"
 *         description: Sort order (asc or desc).
 *     responses:
 *       200:
 *         description: A list of sub-admins with pagination.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/getAdmins",
  authMiddleware,
  authorizeRoles("admin"),
  adminController.getAllAdmins
);

/**
 * @swagger
 * /admins/getAdmin/{adminId}:
 *   get:
 *     summary: Get details of a specific sub-admin
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the admin
 *     responses:
 *       200:
 *         description: Admin details retrieved successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getAdmin/:adminId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  adminController.getAdminById
);

/**
 * @swagger
 * /admins/addSubAdmin:
 *   post:
 *     summary: Create a new sub-admin
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userFirstName
 *               - userLastName
 *               - userEmail
 *               - userPassword
 *             properties:
 *               userFirstName:
 *                 type: string
 *                 example: Jason
 *               userLastName:
 *                 type: string
 *                 example: Derulo
 *               userEmail:
 *                 type: string
 *                 example: jd@admin.com
 *               userPassword:
 *                 type: string
 *                 example: securepassword
 *     responses:
 *       201:
 *         description: Sub-admin created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post(
  "/addSubAdmin",
  authMiddleware,
  authorizeRoles("admin"),
  subAdminValidationRules(),
  validate,
  adminController.addSubAdmin
);

/**
 * @swagger
 * /admins/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     description: Retrieve statistics for the admin dashboard including users, revenue, payouts, refunds, and cases.
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalInspectors:
 *                   type: integer
 *                 totalTenants:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                 totalPayouts:
 *                   type: number
 *                 totalRefunds:
 *                   type: number
 *                 totalCases:
 *                   type: integer
 *                 totalCompleted:
 *                   type: integer
 *                 totalCancelled:
 *                   type: integer
 *                 overviewGraphs:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: integer
 *                           totalUsers:
 *                             type: integer
 *                           totalInspectors:
 *                             type: integer
 *                           totalTenants:
 *                             type: integer
 *                     revenue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: integer
 *                           totalRevenue:
 *                             type: number
 *                           totalPayouts:
 *                             type: number
 *                           totalRefunds:
 *                             type: number
 *                     cases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: integer
 *                           totalCases:
 *                             type: integer
 *                           totalCompleted:
 *                             type: integer
 *                           totalCancelled:
 *                             type: integer
 *       401:
 *         description: Unauthorized, admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  adminController.getAdminDashboard
);

/**
 * @swagger
 * /admins/update/{adminId}:
 *   patch:
 *     summary: Update details of a specific sub-admin
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userFirstName
 *               - userLastName
 *               - userEmail
 *             properties:
 *               userFirstName:
 *                 type: string
 *                 example: Jason
 *               userLastName:
 *                 type: string
 *                 example: Derulo
 *               userEmail:
 *                 type: string
 *                 example: jd@admin.com
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/update/:adminId",
  authMiddleware,
  authorizeRoles("admin"),
  adminController.updateAdmin
);

/**
 * @swagger
 * /admins/delete/{adminId}:
 *   delete:
 *     summary: Delete a sub-admin
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the admin
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/delete/:adminId",
  authMiddleware,
  authorizeRoles("admin"),
  adminController.deleteAdmin
);

/**
 * @swagger
 * /admins/export-dashboard:
 *   get:
 *     summary: Export the admin dashboard data as CSV or PDF
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *         required: true
 *         description: Select export format (csv or pdf).
 *     responses:
 *       200:
 *         description: Exported file generated successfully.
 *       400:
 *         description: Invalid format provided.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/export-dashboard",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  adminController.exportDashboardReport
);

/**
 * @swagger
 * /admins/update-inspector/{inspectorId}:
 *   put:
 *     summary: Update an inspector's details by admin
 *     security:
 *       - BearerAuth: []
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: inspectorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the inspector
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userFirstName:
 *                 type: string
 *                 example: "Michael"
 *               userLastName:
 *                 type: string
 *                 example: "Jordan"
 *               userEmail:
 *                 type: string
 *                 example: "mj@example.com"
 *               userPhone:
 *                 type: string
 *                 example: "+441234567890"
 *               userCity:
 *                 type: string
 *                 example: "London"
 *               userPostcode:
 *                 type: string
 *                 example: "NW1 6XE"
 *               userAddress:
 *                 type: string
 *                 example: "10 Downing Street"
 *               userCountry:
 *                 type: string
 *                 example: "UK"
 *               userGender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *               expertiseCodes:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [101, 102]
 *     responses:
 *       200:
 *         description: Inspector updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Inspector not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/update-inspector/:inspectorId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  updateInspectorByAdminValidation(),
  validate,
  adminController.updateInspectorByAdmin
);

module.exports = router;
