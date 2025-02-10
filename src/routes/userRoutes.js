const express = require("express");
// const { authMiddleware } = require("../middlewares/authMiddleware");
const { userValidationRules } = require("../validators/usersValidator.js");
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
 *     responses:
 *       201:
 *         description: User created successfully
 *       500:
 *         description: Server error
 */
router.post("/signup", userValidationRules(), validate, (req, res) =>
  res.send("User Created")
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
 *               email:
 *                 type: string
 *                 example: "mail@mail.com"
 *               password:
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
 */

router.post("/login", (req, res) => res.send("Login successful"));

module.exports = router;
