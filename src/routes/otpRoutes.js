const express = require("express");
const otpController = require("../controllers/otpController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: OTP
 *   description: OTP management
 */

/**
 * @swagger
 * /otp/request:
 *   post:
 *     summary: Request a new OTP for authentication
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post("/request", otpController.requestOtp);

/**
 * @swagger
 * /otp/resend:
 *   post:
 *     summary: Resend OTP for authentication
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post("/resend", otpController.resendOtp);

/**
 * @swagger
 * /otp/verify:
 *   post:
 *     summary: Verify an OTP for authentication
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 example: "user@example.com"
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully.
 *       400:
 *         description: Invalid or expired OTP.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post("/verify", otpController.verifyOtp);

module.exports = router;
