const { body } = require("express-validator");

const subAdminValidationRules = () => {
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

  ];
};

module.exports = { subAdminValidationRules };
