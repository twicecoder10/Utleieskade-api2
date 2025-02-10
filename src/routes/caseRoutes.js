const express = require("express");
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
 *     summary: Retrieve all cases
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: A list of cases.
 */
router.get("/getCases", (res, req) => res.send("All cases"));

/**
 * @swagger
 * /cases/create-case:
 *   post:
 *     summary: Create a new case
 *     tags: [Cases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caseID:
 *                 type: string
 *                 example: "case001"
 *               caseCreationDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-07"
 *               userId:
 *                 type: string
 *                 example: "user123"
 *               InspectorId:
 *                 type: string
 *                 example: "inspector789"
 *               caseStatus:
 *                 type: string
 *                 example: "Open"
 *               caseDescription:
 *                 type: string
 *                 example: "Water leakage in the bathroom"
 *     responses:
 *       201:
 *         description: Case created successfully
 */
router.post("/create-case", (req, res) => res.send("Created case"));

module.exports = router;
