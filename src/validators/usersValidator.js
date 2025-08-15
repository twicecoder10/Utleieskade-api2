const { body } = require("express-validator");

const userValidationRules = () => {
  return [
    body("userFirstName")
      .notEmpty()
      .withMessage("First name is required")
      .isString()
      .withMessage("First name must be a string"),

    body("userLastName")
      .notEmpty()
      .withMessage("Last name is required")
      .isString()
      .withMessage("Last name must be a string"),

    body("userEmail").isEmail().withMessage("Provide a valid email address"),

    body("userPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),

    body("userPhone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isString()
      .withMessage("Phone number must be a string"),

    body("userCity")
      .notEmpty()
      .withMessage("City is required")
      .isString()
      .withMessage("City must be a string"),

    body("userPostcode")
      .notEmpty()
      .withMessage("Postcode is required")
      .isString()
      .withMessage("Postcode must be a string"),

    body("userAddress")
      .notEmpty()
      .withMessage("Address is required")
      .isString()
      .withMessage("Address must be a string"),

    body("userCountry")
      .notEmpty()
      .withMessage("Country is required")
      .isString()
      .withMessage("Country must be a string"),

    body("userType")
      .isIn(["admin", "tenant", "landlord", "inspector"])
      .withMessage("Invalid user type specified"),
  ];
};

module.exports = { userValidationRules };
