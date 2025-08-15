const express = require("express");
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/roleMiddleware.js");
const { userValidationRules } = require("../validators/userValidator.js");
const { validate } = require("../middlewares/validate");

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
 *                 example: "landlord"
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
  userValidationRules(),
  validate,
  userController.createUser
);

/**
 * @swagger
 * /users/login/{userType}:
 *   post:
 *     summary: User login with userType parameter
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of user (admin, inspector, tenant, landlord)
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
 *       403:
 *         description: Forbidden - User not valid for auth on this route
 *       500:
 *         description: Server error
 */
router.post("/login/:userType", userController.loginUser);

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
 *               currentPassword:
 *                 type: string
 *                 example: "securepassword"
 *               newPassword:
 *                 type: string
 *                 example: "newsecurepassword"
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

// /**
//  * @swagger
//  * /users/send-password-reset-email:
//  *   post:
//  *     summary: Send a password reset email
//  *     tags: [Users]
//  *     description: Sends a password reset link to the user's email address.
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               userEmail:
//  *                 type: string
//  *                 example: "mail@mail.com"
//  *     responses:
//  *       200:
//  *         description: Password reset email sent successfully.
//  *       400:
//  *         description: Email is required or user does not exist.
//  *       500:
//  *         description: Internal server error.
//  */
// router.post(
//   "/send-password-reset-email",
//   userController.sendPasswordResetEmail
// );

// /**
//  * @swagger
//  * /users/verify-password-reset-link:
//  *   get:
//  *     summary: Verify password reset link
//  *     tags: [Users]
//  *     description: Checks if the password reset link (token) is valid and redirects user accordingly.
//  *     parameters:
//  *       - in: query
//  *         name: token
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The token received in the password reset email.
//  *     responses:
//  *       302:
//  *         description: Redirects to the password reset page.
//  *       400:
//  *         description: No token provided.
//  *       401:
//  *         description: Invalid or expired token.
//  *       500:
//  *         description: Internal server error.
//  */
// router.get("/verify-password-reset-link", userController.verifyPasswordReset);

/**
 * @swagger
 * /users/reset-password:
 *   put:
 *     summary: Reset user password
 *     tags: [Users]
 *     description: Allows users to reset their password using a verified token.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The token received in the password reset email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userPassword:
 *                 type: string
 *                 example: "newsecurepassword"
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *       400:
 *         description: Password is required or reset request not made.
 *       401:
 *         description: Invalid or expired token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.put("/reset-password", userController.updatePassword);

module.exports = router;
