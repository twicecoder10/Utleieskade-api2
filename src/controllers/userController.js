const userService = require("../services/userService");
const responseHandler = require("../utils/responseHandler");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { generateToken } = require("../utils/generateToken");

exports.createUser = async (req, res) => {
  try {
    const {
      userFirstName,
      userLastName,
      userEmail,
      userGender,
      userPhone,
      userCity,
      userPostcode,
      userAddress,
      userCountry,
      userType,
      userPassword,
    } = req.body;

    const hashedPassword = await bcrypt.hash(userPassword.trim(), 10);

    const userData = {
      userId: uuidv4(),
      userFirstName: userFirstName.trim(),
      userLastName: userLastName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userGender: userGender.trim().toLowerCase(),
      userPhone: userPhone.trim(),
      userCity: userCity.trim(),
      userPostcode: userPostcode.trim(),
      userAddress: userAddress.trim(),
      userCountry: userCountry.trim(),
      userType,
      userPassword: hashedPassword,
    };

    const newUser = await userService.createUser(userData);

    const token = generateToken(newUser.userId, "7d", newUser.userType);
    responseHandler.setSuccess(201, "User created successfully", {
      token,
      userType: newUser.userType,
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
    if (user.userType === "inspector" && user.userStatus === "inactive") {
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
    const updateData = req.body;

    delete updateData.userId;
    delete updateData.userType;
    delete updateData.userPassword;
    delete updateData.userStatus;

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
