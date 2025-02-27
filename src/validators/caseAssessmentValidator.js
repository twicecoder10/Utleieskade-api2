const { body } = require("express-validator");

const caseAssessmentValidationRules = () => {
  return [
    body("caseId")
      .notEmpty()
      .withMessage("Case ID is required")
      .isUUID()
      .withMessage("Invalid Case ID format"),

    body("reportDescription")
      .notEmpty()
      .withMessage("Report description is required")
      .isString()
      .withMessage("Report description must be a string"),

    body("photos").optional().isArray().withMessage("Photos must be an array"),

    body("photos.*.photoUrl")
      .optional()
      .isURL()
      .withMessage("Photo URL must be a valid URL"),
  ];
};

module.exports = { caseAssessmentValidationRules };
