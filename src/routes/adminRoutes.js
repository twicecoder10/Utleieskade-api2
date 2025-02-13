const express = require("express");
const adminController = require("../controllers/adminController.js");
const { adminValidationRules } = require("../validators/adminValidator.js");
const { validate } = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management
 */

/**
 * @swagger
 * /admins/signup:
 *   post:
 *     summary: Create a new admin user
 *     tags: [Admin]
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
 *         description: User created successfully
 *       400:
 *         description: The user already exists!
 *       500:
 *         description: Internal server error
 */

router.post(
  "/signup",
  adminValidationRules(),
  validate,
  adminController.createUser
);

module.exports = router;
