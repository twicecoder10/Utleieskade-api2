const express = require("express");
const tenantController = require("../controllers/tenantController");
const { authMiddleware, authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management
 */

/**
 * @swagger
 * /tenants/allTenants:
 *   get:
 *     summary: Fetch all tenants with pagination & search
 *     security:
 *       - BearerAuth: []
 *     tags: [Tenants]
 *     description: Retrieve a list of all tenants with optional search & pagination.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tenants by name or email.
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
 *         description: Number of tenants per page.
 *     responses:
 *       200:
 *         description: List of tenants retrieved successfully
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
 *                   example: "Tenants retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tenantId:
 *                             type: string
 *                             example: "4590AH"
 *                           firstName:
 *                             type: string
 *                             example: "Zack"
 *                           lastName:
 *                             type: string
 *                             example: "Holland"
 *                           email:
 *                             type: string
 *                             example: "zackholland@gmail.com"
 *                           phone:
 *                             type: string
 *                             example: "+442838484802"
 *                           casesSubmitted:
 *                             type: integer
 *                             example: 45
 *                           country:
 *                             type: string
 *                             example: "United Kingdom"
 *                           dateRegistered:
 *                             type: string
 *                             format: date
 *                             example: "2025-02-10T14:05:25.000Z"
 *                     totalTenants:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Internal server error
 */
router.get(
  "/allTenants",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  tenantController.getAllTenants
);

/**
 * @swagger
 * /tenants/getTenant/{tenantId}:
 *   get:
 *     summary: Fetch tenant details by ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Tenants]
 *     description: Retrieve the details of a specific tenant by their ID.
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the tenant
 *     responses:
 *       200:
 *         description: Tenant details retrieved successfully
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
 *                   example: "Tenant details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenantId:
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
 *                     country:
 *                       type: string
 *                       example: "United Kingdom"
 *                     dateRegistered:
 *                       type: string
 *                       format: date
 *                       example: "2025-03-29"
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getTenant/:tenantId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  tenantController.getTenantById
);

/**
 * @swagger
 * /tenants/export:
 *   get:
 *     summary: Export list of tenants as CSV or PDF
 *     security:
 *       - BearerAuth: []
 *     tags: [Tenants]
 *     description: Export all tenants in CSV or PDF format.
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
 *         description: Tenants exported successfully
 *       404:
 *         description: No tenants found
 *       500:
 *         description: Internal server error
 */
router.get("/export", authMiddleware, authorizeRoles("admin", "sub-admin"), tenantController.exportTenants);

/**
 * @swagger
 * /tenants/getTransactions/{tenantId}:
 *   get:
 *     summary: Get transaction history for a specific tenant with pagination, search, and sorting
 *     security:
 *       - BearerAuth: []
 *     tags: [Tenants]
 *     description: Retrieve all transactions linked to a specific tenant, including case details and payment status.
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the tenant
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search transactions by case ID or inspector name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "processed", "rejected"]
 *         description: Filter transactions by payment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions up to this date
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
 *         description: Number of transactions per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: "paymentDate"
 *         description: Field to sort by (e.g., paymentDate, amount)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: ["asc", "desc"]
 *           example: "desc"
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       400:
 *         description: Bad request (invalid parameters)
 *       404:
 *         description: No transactions found for the tenant
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getTransactions/:tenantId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  tenantController.getTenantTransactions
);

/**
 * @swagger
 * /tenants/deactivate/{tenantId}:
 *   patch:
 *     summary: Set tenant status to inactive
 *     security:
 *       - BearerAuth: []
 *     tags: [Tenants]
 *     description: Deactivate a tenant by setting their status to inactive.
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the tenant
 *     responses:
 *       200:
 *         description: Tenant deactivated successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/deactivate/:tenantId",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  tenantController.deactivateTenant
);

module.exports = router;
