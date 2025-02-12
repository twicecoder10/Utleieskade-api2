const express = require("express");
const inspectorController = require("../controllers/inspectorController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
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
 *               inspectorExpertiseCode:
 *                 type: integer
 *                 example: 101
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
  isAdmin,
  inspectorValidationRules(),
  validate,
  inspectorController.addInspector
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
  isAdmin,
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
  isAdmin,
  inspectorController.getAllInspectors
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
  isAdmin,
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
router.patch("/deactivate/:inspectorId", authMiddleware, isAdmin, inspectorController.deactivateInspector);

module.exports = router;
