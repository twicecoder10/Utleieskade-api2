const userService = require("../services/userService");
const responseHandler = require("../utils/responseHandler");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/generateToken");
const { verifyToken } = require("../utils/verifyToken");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

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

    const token = generateToken(newUser.userId, "7d", newUser.userType);
    responseHandler.setSuccess(201, "User created successfully", {
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

    if (
      (userType === "admin" &&
        !["admin", "sub-admin"].includes(user.userType)) ||
      (userType !== "admin" && userType !== user.userType)
    ) {
      responseHandler.setError(
        403,
        `Unauthorized access, ${user.userType} cannot login as ${userType}`
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

// exports.sendPasswordResetEmail = async (req, res) => {
//   try {
//     if (!req.body.userEmail) {
//       responseHandler.setError(400, "Email is required!");
//       return responseHandler.send(res);
//     }
//     const user = await userService.fetchUserByEmail(
//       req.body.userEmail.trim().toLowerCase()
//     );
//     if (!user) {
//       responseHandler.setError(400, "User with the email does not exist");
//       return responseHandler.send(res);
//     }

//     const token = generateToken(user.userId, "30m");

//     await userService.updateUser(user.userId, {
//       token: token,
//     });

//     const url = `${process.env.API_BASE_URL}/users/verify-password-reset-link?token=${token}`;
//     const text = emailTemplate(
//       "UTLEIESKADE PASSWORD RESET CONFIRMATION",
//       `<div style="text-align: left; font-family: Arial, sans-serif;">
//           Dear user,<p>Please find below your password reset link based on your recent password reset request.
//           <br>If you did not request for this password change, Kindly <b>IGNORE</b> this email
//           <p><a href="${url}"><button style= "background-color: rgb(78, 157, 230); border-radius: 3px; color: white;
//               border: none; padding: 10px; cursor: pointer;">Reset Password</button></a>
//           </p><br>
//           </div>`
//     );
//     await sendEmail(user.userEmail, "Password Reset", text);

//     responseHandler.setSuccess(200, `Email sent to ${user.userEmail}`);
//     return responseHandler.send(res);
//   } catch (error) {
//     console.error(error);
//     responseHandler.setError(
//       500,
//       "Password reset email can't be sent at the moment... Please retry later."
//     );
//     return responseHandler.send(res);
//   }
// };

// exports.verifyPasswordReset = async (req, res) => {
//   try {
//     const token = req.query.token;
//     if (!token) {
//       responseHandler.setError(400, "No token provided.");
//       return responseHandler.send(res);
//     }
//     const verification = await verifyToken(token);
//     if (verification.status == false) {
//       responseHandler.setError(401, verification.message);
//       return responseHandler.send(res);
//     }
//     if (token) {
//       const userId = verification.message.id;
//       await userService.updateUser(userId, {
//         token: null,
//         userPassword: "default",
//       });
//       res.redirect(
//         `${process.env.UTLEIESKADE_BASE_URL}/Reset-password/?token=${token}`
//       );
//     }
//   } catch (error) {
//     responseHandler.setError(500, "Internal Server Error. Please retry later");
//     return responseHandler.send(res);
//   }
// };

exports.updatePassword = async (req, res) => {
  try {
    if (!req.body.userPassword) {
      responseHandler.setError(400, "Password is required!");
      return responseHandler.send(res);
    }
    const token = req.query.token;

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
