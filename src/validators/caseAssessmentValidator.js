const { body } = require("express-validator");

const caseAssessmentValidationRules = () => {
  return [
    body("caseId").notEmpty().withMessage("Case ID is required"),

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

    body("items")
      .isArray({ min: 1 })
      .withMessage("At least one assessment item is required"),

    body("items.*.item")
      .notEmpty()
      .withMessage("Item name is required")
      .isString()
      .withMessage("Item must be a string"),

    body("items.*.quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),

    body("items.*.unitPrice")
      .isFloat({ min: 0 })
      .withMessage("Unit price must be a non-negative number"),

    body("items.*.hours")
      .isInt({ min: 0 })
      .withMessage("Hours must be a non-negative integer"),

    body("items.*.hourlyRate")
      .isFloat({ min: 0 })
      .withMessage("Hourly rate must be a non-negative number"),

    body("items.*.sumMaterial")
      .isFloat({ min: 0 })
      .withMessage("Sum material must be a non-negative number"),

    body("items.*.sumWork")
      .isFloat({ min: 0 })
      .withMessage("Sum work must be a non-negative number"),

    body("items.*.sumPost")
      .isFloat({ min: 0 })
      .withMessage("Sum post must be a non-negative number"),

    body("summary").notEmpty().withMessage("Summary is required"),

    body("summary.totalHours")
      .isInt({ min: 0 })
      .withMessage("Total hours must be a non-negative integer"),

    body("summary.totalSumMaterials")
      .isFloat({ min: 0 })
      .withMessage("Total material sum must be a non-negative number"),

    body("summary.totalSumLabor")
      .isFloat({ min: 0 })
      .withMessage("Total labor sum must be a non-negative number"),

    body("summary.sumExclVAT")
      .isFloat({ min: 0 })
      .withMessage("Sum excl. VAT must be a non-negative number"),

    body("summary.vat")
      .isFloat({ min: 0 })
      .withMessage("VAT must be a non-negative number"),

    body("summary.sumInclVAT")
      .isFloat({ min: 0 })
      .withMessage("Sum incl. VAT must be a non-negative number"),

    body("summary.total")
      .isFloat({ min: 0 })
      .withMessage("Total must be a non-negative number"),
  ];
};

module.exports = { caseAssessmentValidationRules };
