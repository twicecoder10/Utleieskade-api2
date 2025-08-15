const responseHandler = require("../utils/responseHandler");
const OtpService = require("../services/otpService");
const userService = require("../services/userService");
const { generateToken } = require("../utils/generateToken");

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

    const response = await OtpService.validateOtp(user.userId, otpCode);

    if (response.statusCode === 200) {
      const token = generateToken(user.userId, "30m");

      await userService.updateUser(user.userId, {
        isVerified: true,
        userPassword: "default",
        token,
      });

      responseHandler.setSuccess(response.statusCode, response.message, token);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(response.statusCode, response.message);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};
