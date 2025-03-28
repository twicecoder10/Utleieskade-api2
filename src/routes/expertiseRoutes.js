const express = require("express");
const expertiseController = require("../controllers/expertiseController");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * /expertises/getAllExpertises:
 *   get:
 *     summary: Retrieve all expertises
 *     security:
 *       - BearerAuth: []
 *     tags: [Expertises]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search expertise by area.
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
 *         description: Number of expertises per page.
 *     responses:
 *       200:
 *         description: List of expertises retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getAllExpertises",
  authMiddleware,
  expertiseController.getExpertises
);

/**
 * @swagger
 * /expertises/createExpertise:
 *   post:
 *     summary: Add a new expertise
 *     security:
 *       - BearerAuth: []
 *     tags: [Expertises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expertiseArea:
 *                 type: string
 *                 example: "Electrical Safety"
 *               expertiseDescription:
 *                 type: string
 *                 example: "Certified electrical safety inspections"
 *     responses:
 *       201:
 *         description: Expertise added successfully
 *       400:
 *         description: Expertise already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  "/createExpertise",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  expertiseController.createExpertise
);

/**
 * @swagger
 * /expertises/update/{expertiseCode}:
 *   put:
 *     summary: Update an existing expertise
 *     security:
 *       - BearerAuth: []
 *     tags: [Expertises]
 *     parameters:
 *       - in: path
 *         name: expertiseCode
 *         required: true
 *         schema:
 *           type: integer
 *         description: Expertise code to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expertiseArea:
 *                 type: string
 *                 example: "Updated Electrical Safety"
 *               expertiseDescription:
 *                 type: string
 *                 example: "Updated certification for electrical safety inspections"
 *     responses:
 *       200:
 *         description: Expertise updated successfully
 *       404:
 *         description: Expertise not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/update/:expertiseCode",
  authMiddleware,
  authorizeRoles("admin", "sub-admin"),
  expertiseController.updateExpertise
);

/**
 * @swagger
 * /expertises/delete/{expertiseCode}:
 *   delete:
 *     summary: Delete an expertise
 *     security:
 *       - BearerAuth: []
 *     tags: [Expertises]
 *     parameters:
 *       - in: path
 *         name: expertiseCode
 *         required: true
 *         schema:
 *           type: integer
 *         description: Expertise code to delete.
 *     responses:
 *       200:
 *         description: Expertise deleted successfully
 *       404:
 *         description: Expertise not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/delete/:expertiseCode",
  authMiddleware,
  authorizeRoles("admin"),
  expertiseController.deleteExpertise
);

module.exports = router;
