const userService = require("../services/userService");
const responseHandler = require("../utils/responseHandler");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/generateToken");
const { verifyToken } = require("../utils/verifyToken");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");
const OtpService = require("../services/otpService");

exports.createUser = async (req, res) => {
  try {
    const {
      userFirstName,
      userLastName,
      userEmail,
      userPhone,
      userCity,
      userPostcode,
      userAddress,
      userType,
      userPassword,
    } = req.body;

    const hashedPassword = await bcrypt.hash(userPassword.trim(), 10);

    const userData = {
      userId: generateUniqueId("USER"),
      userFirstName: userFirstName.trim(),
      userLastName: userLastName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userPhone: userPhone.trim(),
      userCity: userCity.trim(),
      userPostcode: userPostcode.trim(),
      userAddress: userAddress.trim(),
      userType,
      userPassword: hashedPassword,
      isVerified: false,
    };

    const newUser = await userService.createUser(userData);

    // Send OTP email for email verification
    try {
      await OtpService.generateOtp(newUser.userId, newUser.userEmail);
      console.log(`OTP email sent to ${newUser.userEmail} after signup`);
    } catch (emailError) {
      // Log error but don't fail signup - user can request OTP later
      console.error(`Failed to send OTP email after signup to ${newUser.userEmail}:`, emailError.message);
    }

    const token = generateToken(newUser.userId, "7d", newUser.userType);
    responseHandler.setSuccess(201, "User created successfully. Please check your email for verification code.", {
      token,
      userType: newUser.userType,
      isVerified: newUser.isVerified,
    });

    return responseHandler.send(res);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      responseHandler.setError(
        400,
        `The ${error.errors[0].path} already exists!`
      );
      return responseHandler.send(res);
    }
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;
    const { userType } = req.params;

    if (!userEmail || !userPassword) {
      responseHandler.setError(400, "Email and password are required!");
      return responseHandler.send(res);
    }

    const user = await userService.fetchUserByEmail(
      userEmail.trim().toLowerCase()
    );

    if (!user) {
      responseHandler.setError(
        401,
        "User with the provided email does not exist"
      );
      return responseHandler.send(res);
    }

    // Allow tenant and landlord to login through either endpoint
    // Admin and inspector still require exact match
    if (userType === "admin") {
      // Only admin and sub-admin can login as admin
      if (!["admin", "sub-admin"].includes(user.userType)) {
        responseHandler.setError(
          403,
          `Unauthorized access, ${user.userType} cannot login as ${userType}`
        );
        return responseHandler.send(res);
      }
    } else if (userType === "inspector") {
      // Inspector must match exactly
      if (user.userType !== "inspector") {
        responseHandler.setError(
          403,
          `Unauthorized access, ${user.userType} cannot login as ${userType}`
        );
        return responseHandler.send(res);
      }
    } else if (["tenant", "landlord"].includes(userType)) {
      // Allow tenant and landlord to login through either tenant or landlord endpoint
      if (!["tenant", "landlord"].includes(user.userType)) {
        responseHandler.setError(
          403,
          `Unauthorized access, ${user.userType} cannot login as ${userType}`
        );
        return responseHandler.send(res);
      }
    } else {
      // Unknown userType in URL
      responseHandler.setError(
        400,
        `Invalid user type: ${userType}`
      );
      return responseHandler.send(res);
    }

    if (
      (user.userType === "inspector" || user.userType === "sub-admin") &&
      user.userStatus === "inactive"
    ) {
      responseHandler.setError(
        403,
        "Inspector account is inactive. Contact support."
      );
      return responseHandler.send(res);
    }

    if (user.userPassword === "default") {
      responseHandler.setError(400, "Password reset required");
      return responseHandler.send(res);
    }

    const isPasswordValid = await bcrypt.compare(
      userPassword,
      user.userPassword
    );
    if (!isPasswordValid) {
      responseHandler.setError(401, "Invalid Password");
      return responseHandler.send(res);
    }

    const token = generateToken(user.userId, "7d", user.userType);
    responseHandler.setSuccess(200, "User logged in successfully", {
      token,
      userType: user.userType,
      isVerified: user.isVerified,
    });

    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.fetchUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      responseHandler.setError(404, "User not found");
      return responseHandler.send(res);
    }
    if (user.password == "default") {
      responseHandler.setError(200, "Password reset required");
      return responseHandler.send(res);
    }
    responseHandler.setSuccess(200, "User retrieved", user);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { currentPassword, newPassword, ...updateData } = req.body;

    delete updateData.userId;
    delete updateData.userType;
    delete updateData.userStatus;

    if (currentPassword && newPassword) {
      const user = await userService.getUserById(req.user.id, true);

      if (!user) {
        responseHandler.setError(404, "User not found");
        return responseHandler.send(res);
      }

      const isPasswordValid = bcrypt.compareSync(
        currentPassword,
        user.userPassword
      );
      if (!isPasswordValid) {
        responseHandler.setError(403, "Current password is incorrect");
        return responseHandler.send(res);
      }

      updateData.userPassword = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await userService.updateUser(req.user.id, updateData);

    if (!updatedUser) {
      responseHandler.setError(404, "User not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "User updated successfully", updatedUser);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.sendPasswordResetEmail = async (req, res) => {
  try {
    if (!req.body.userEmail) {
      responseHandler.setError(400, "Email is required!");
      return responseHandler.send(res);
    }
    const user = await userService.fetchUserByEmail(
      req.body.userEmail.trim().toLowerCase()
    );
    if (!user) {
      responseHandler.setError(400, "User with the email does not exist");
      return responseHandler.send(res);
    }

    // Use OTP service to send password reset OTP
    const otpResponse = await OtpService.generateOtp(
      user.userId,
      user.userEmail
    );

    // Check if OTP was already sent (rate limiting)
    if (otpResponse.statusCode === 200 && otpResponse.message?.includes("already been sent")) {
      responseHandler.setSuccess(200, otpResponse.message);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, otpResponse.message || `OTP sent to ${user.userEmail}`);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Password reset email error:", error);
    console.error("Error stack:", error.stack);
    
    // Provide more specific error messages
    let errorMessage = "Password reset email can't be sent at the moment... Please retry later.";
    if (error.message?.includes("Email service is not configured")) {
      errorMessage = "Email service is not configured. Please contact support.";
    } else if (error.message?.includes("Email server connection failed")) {
      errorMessage = "Email server connection failed. Please check email configuration.";
    } else if (error.message?.includes("Email authentication failed")) {
      errorMessage = "Email authentication failed. Please check email credentials.";
    } else if (error.message?.includes("Email failed to send")) {
      errorMessage = "Failed to send email. Please check email configuration.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    responseHandler.setError(500, errorMessage);
    return responseHandler.send(res);
  }
};

exports.verifyPasswordReset = async (req, res) => {
  try {
    // Support both query param and body for token (OTP code)
    const token = req.query.token || req.body.token;
    const userEmail = req.body.userEmail;
    
    if (!token) {
      responseHandler.setError(400, "OTP code is required.");
      return responseHandler.send(res);
    }

    if (!userEmail) {
      responseHandler.setError(400, "Email is required.");
      return responseHandler.send(res);
    }

    const user = await userService.fetchUserByEmail(userEmail.trim().toLowerCase());
    if (!user) {
      responseHandler.setError(404, "User not found.");
      return responseHandler.send(res);
    }

    // Verify OTP using OTP service
    const otpResponse = await OtpService.validateOtp(user.userId, token);

    if (otpResponse.statusCode === 200) {
      // Generate a password reset token (valid for 30 minutes)
      const resetToken = generateToken(user.userId, "30m");

      // Set user password to "default" and store the reset token
      await userService.updateUser(user.userId, {
        userPassword: "default",
        token: resetToken,
      });

      responseHandler.setSuccess(200, "OTP verified successfully. You can now reset your password.", {
        token: resetToken,
      });
      return responseHandler.send(res);
    }

    responseHandler.setError(otpResponse.statusCode || 400, otpResponse.message || "Invalid or expired OTP.");
    return responseHandler.send(res);
  } catch (error) {
    console.error(error);
    responseHandler.setError(500, "Internal Server Error. Please retry later");
    return responseHandler.send(res);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    if (!req.body.userPassword) {
      responseHandler.setError(400, "Password is required!");
      return responseHandler.send(res);
    }
    
    // Support both query param and body for token
    const token = req.query.token || req.body.token;

    if (!token) {
      responseHandler.setError(404, "No token provided");
      return responseHandler.send(res);
    }

    const verification = await verifyToken(token);
    if (verification.status == false) {
      responseHandler.setError(401, verification.message);
      return responseHandler.send(res);
    }

    const user = await userService.getUserById(verification.message.id, true);
    if (!user) {
      responseHandler.setError(404, "User not found");
      return responseHandler.send(res);
    }

    if (user.userPassword !== "default" || user.token !== token) {
      responseHandler.setError(
        400,
        "Please request for a password reset before attempting an update"
      );
      return responseHandler.send(res);
    }
    const newPassword = await bcrypt.hash(req.body.userPassword.trim(), 10);
    await userService.updateUser(verification.message.id, {
      userPassword: newPassword,
      token: null,
    });
    responseHandler.setSuccess(200, "Password updated!");
    return responseHandler.send(res);
  } catch (error) {
    console.error(error);
    responseHandler.setError(500, "Internal Server Error. Please retry later");
    return responseHandler.send(res);
  }
};
