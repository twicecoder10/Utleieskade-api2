const express = require("express");
const userController = require("../controllers/userController");
const { userValidationRules } = require("../validators/usersValidator.js");
const { validate } = require("../middlewares/validate");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *               userType:
 *                 type: string
 *                 enum: ["admin", "tenant", "landlord", "inspector"]
 *                 example: "inspector"
 *               userStatus:
 *                 type: string
 *                 enum: ["active", "inactive"]
 *                 example: "active"
 *               inspectorExpertiseCode:
 *                 type: integer
 *                 example: 101
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
  userValidationRules(),
  validate,
  userController.createUser
);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 example: "mail@mail.com"
 *               userPassword:
 *                 type: string
 *                 example: "securepassword"
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1..."
 *       401:
 *         description: Unauthorized - Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", userController.loginUser);

/**
 * @swagger
 * /users/fetchProfile:
 *   get:
 *     summary: Fetch authenticated user profile
 *     security:
 *       - BearerAuth: []
 *     tags: [Users]
 *     description: Retrieve the profile of the currently authenticated user.
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                   example: "User retrieved"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     userFirstName:
 *                       type: string
 *                       example: "John"
 *                     userLastName:
 *                       type: string
 *                       example: "Doe"
 *                     userEmail:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     userPhone:
 *                       type: string
 *                       example: "+123456789"
 *                     userType:
 *                       type: string
 *                       example: "tenant"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/fetchProfile", authMiddleware, userController.fetchUserProfile);

/**
 * @swagger
 * /users/update:
 *   put:
 *     summary: Update the authenticated user's details
 *     security:
 *       - BearerAuth: []
 *     tags: [Users]
 *     description: Allows an authenticated user to update their profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userFirstName:
 *                 type: string
 *                 example: "Updated Name"
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 example: "updatedemail@example.com"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/update", authMiddleware, userController.updateUser);

module.exports = router;
