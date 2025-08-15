const { body } = require("express-validator");

const extendCaseDeadlineValidationRules = () => [
  body("newDeadline")
    .notEmpty()
    .withMessage("New deadline is required")
    .isISO8601()
    .withMessage("Deadline must be a valid ISO8601 date string"),
];

module.exports = { extendCaseDeadlineValidationRules };