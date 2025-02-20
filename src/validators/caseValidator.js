const { body } = require("express-validator");

const caseValidationRules = () => {
  return [
    body("propertyId")
      .notEmpty()
      .withMessage("Property ID is required")
      .isUUID()
      .withMessage("Invalid Property ID format"),

    body("buildingNumber")
      .optional()
      .isString()
      .withMessage("Building number must be a string"),

    body("caseDescription")
      .notEmpty()
      .withMessage("Case description is required")
      .isString()
      .withMessage("Case description must be a string"),

    body("caseUrgencyLevel")
      .isIn(["high", "low", "moderate"])
      .withMessage("Invalid case urgency level specified"),

    body("damages")
      .isArray({ min: 1 })
      .withMessage("At least one damage must be reported"),

    body("damages.*.damageLocation")
      .notEmpty()
      .withMessage("Damage location is required")
      .isString()
      .withMessage("Damage location must be a string"),

    body("damages.*.damageType")
      .notEmpty()
      .withMessage("Damage type is required")
      .isString()
      .withMessage("Damage type must be a string"),

    body("damages.*.damageDescription")
      .notEmpty()
      .withMessage("Damage description is required")
      .isString()
      .withMessage("Damage description must be a string"),

    body("damages.*.damageDate")
      .notEmpty()
      .withMessage("Damage date is required")
      .isISO8601()
      .withMessage("Invalid date format, use YYYY-MM-DD"),

    body("damages.*.photos")
      .optional()
      .isArray()
      .withMessage("Photos must be an array"),

    body("damages.*.photos.*.photoType")
      .optional()
      .isString()
      .withMessage("Photo type must be a string"),

    body("damages.*.photos.*.photoUrl")
      .optional()
      .isURL()
      .withMessage("Photo URL must be a valid URL"),
  ];
};

module.exports = { caseValidationRules };
