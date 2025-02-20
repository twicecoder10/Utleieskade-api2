const responseHandler = require("../utils/responseHandler");
const OtpService = require("../services/otpService");
const userService = require("../services/userService");

exports.requestOtp = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const user = await userService.fetchUserByEmail(userEmail);

    if (!user) {
      responseHandler.setError(404, "User not found.");
      return responseHandler.send(res);
    }

    const otpResponse = await OtpService.generateOtp(
      user.userId,
      user.userEmail
    );

    responseHandler.setSuccess(200, otpResponse);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const user = await userService.fetchUserByEmail(userEmail);

    if (!user) {
      responseHandler.setError(404, "User not found.");
      return responseHandler.send(res);
    }

    const otpResponse = await OtpService.resendOtp(user.userId, user.userEmail);

    responseHandler.setSuccess(200, otpResponse);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { userEmail, otpCode } = req.body;
    const user = await userService.fetchUserByEmail(userEmail);

    if (!user) {
      responseHandler.setError(404, "User not found.");
      return responseHandler.send(res);
    }

    const isValidOtp = await OtpService.validateOtp(user.userId, otpCode);

    if (!isValidOtp) {
      responseHandler.setError(400, "Invalid or expired OTP.");
      return responseHandler.send(res);
    }

    await userService.updateUser(user.userId, { isVerified: true });

    responseHandler.setSuccess(200, "OTP verified successfully.");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};
