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
      userPhone,
      userCity,
      userPostcode,
      userAddress,
      userCountry,
      userPassword,
    } = req.body;

    const hashedPassword = await bcrypt.hash(userPassword.trim(), 10);

    const userData = {
      userId: uuidv4(),
      userFirstName: userFirstName.trim(),
      userLastName: userLastName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userPhone: userPhone.trim(),
      userCity: userCity.trim(),
      userPostcode: userPostcode.trim(),
      userAddress: userAddress.trim(),
      userCountry: userCountry.trim(),
      userType: "admin",
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
