const { body } = require("express-validator");

const userValidationRules = () => {
  return [
    body("userFirstName").notEmpty().withMessage("First name is required"),
    body("userLastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Provide a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("role")
      .isIn(["admin", "tenant", "inspector", "landlord"])
      .withMessage("Invalid role specified"),
  ];
};

module.exports = { userValidationRules };
