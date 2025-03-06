const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const { Otp } = require("../models/index");
const sendEmail = require("../utils/sendEmail");
const emailTemplate = require("../utils/emailTemplate");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const userService = require("../services/userService");
const { message } = require("../utils/responseHandler");

class OtpService {
  /**
   * Generates a 6-digit OTP, stores it securely, and sends it via email.
   * @param {string} userId - User's unique ID.
   * @param {string} userEmail - User's email for OTP delivery.
   */
  static async generateOtp(userId, userEmail) {
    try {
      const existingOtp = await Otp.findOne({
        where: {
          userId,
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      if (existingOtp) {
        return {
          statusCode: 200,
          message:
            "An OTP has already been sent. Please wait for it to expire.",
        };
      }

      await userService.updateUser(userId, { isVerified: false });
      return await this.createAndSendOtp(userId, userEmail);
    } catch (error) {
      console.error("Error generating OTP:", error);
      throw new Error("Error generating OTP: " + error.message);
    }
  }

  /**
   * Resends an OTP if the previous one is expired or was not received.
   * @param {string} userId - User's unique ID.
   * @param {string} userEmail - User's email for OTP delivery.
   */
  static async resendOtp(userId, userEmail) {
    try {
      const otpRecord = await Otp.findOne({
        where: {
          userId,
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      const currentTime = new Date();

      if (otpRecord) {
        const lastRequestTime = new Date(otpRecord.updatedAt);

        if (currentTime - lastRequestTime < 60 * 1000) {
          return {
            statusCode: 400,
            message:
              "Please wait at least 1 minute before requesting a new OTP.",
          };
        }

        return await this.updateAndSendOtp(otpRecord.otpId, userEmail);
      }

      await userService.updateUser(userId, { isVerified: false });
      return await this.createAndSendOtp(userId, userEmail);
    } catch (error) {
      console.error("Error resending OTP:", error);
      throw new Error("Error resending OTP: " + error.message);
    }
  }

  /**
   * Validates the OTP entered by the user.
   * @param {string} userId - User's ID.
   * @param {string} otpCode - OTP entered by the user.
   * @returns {Object} - { valid: boolean, message: string }
   */
  static async validateOtp(userId, otpCode) {
    try {
      const otpRecord = await Otp.findOne({
        where: {
          userId,
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      if (!otpRecord) {
        return { statusCode: 400, message: "OTP expired or does not exist." };
      }

      const isMatch = await bcrypt.compare(otpCode, otpRecord.otpCode);
      if (!isMatch) {
        return { success: false, statusCode: 400, message: "Invalid OTP." };
      }

      await Otp.destroy({ where: { otpId: otpRecord.otpId } });

      return { statusCode: 200, message: "OTP verified successfully." };
    } catch (error) {
      console.error("Error validating OTP:", error);
      throw new Error("Error validating OTP: " + error.message);
    }
  }

  /**
   * Creates and sends a new OTP.
   * @param {string} userId - User's unique ID.
   * @param {string} userEmail - User's email for OTP delivery.
   */
  static async createAndSendOtp(userId, userEmail) {
    try {
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await Otp.create({
        otpId: uuidv4(),
        userId,
        otpCode: hashedOtp,
        expiresAt,
      });

      await this.sendOtpEmail(userEmail, otpCode);

      return "OTP sent successfully.";
    } catch (error) {
      console.error("Error creating OTP:", error);
      throw new Error("Error creating OTP: " + error.message);
    }
  }

  /**
   * Updates and resends an existing OTP.
   * @param {string} otpId - Existing OTP ID.
   * @param {string} userEmail - User's email for OTP delivery.
   */
  static async updateAndSendOtp(otpId, userEmail) {
    try {
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await Otp.update({ otpCode: hashedOtp, expiresAt }, { where: { otpId } });

      await this.sendOtpEmail(userEmail, otpCode);

      return true;
    } catch (error) {
      console.error("Error updating OTP:", error);
      throw new Error("Error updating OTP: " + error.message);
    }
  }

  /**
   * Sends an email containing the OTP.
   * @param {string} userEmail - Recipient's email.
   * @param {string} otpCode - OTP to be sent.
   */
  static async sendOtpEmail(userEmail, otpCode) {
    try {
      const text = emailTemplate(
        "Your OTP Verification Code",
        `Your OTP code is: ${otpCode}. It will expire in 10 minutes.`
      );
      return await sendEmail(userEmail, "Your OTP Verification Code", text);
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new Error("Error sending OTP email: " + error.message);
    }
  }
}

module.exports = OtpService;
