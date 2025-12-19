const { body } = require("express-validator");

const caseValidationRules = () => {
  return [
    body("propertyId")
      .notEmpty()
      .withMessage("Property ID is required")
      .isString()
      .withMessage("Property ID must be a string"),

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
      .custom((value) => {
        // Accept full URLs (http/https) or relative paths starting with /files/
        if (typeof value === 'string' && value.trim().length > 0) {
          const trimmed = value.trim();
          // Check if it's a full URL or a relative path
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/files/')) {
            return true;
          }
          // Also accept Azure blob URLs
          if (trimmed.includes('blob.core.windows.net')) {
            return true;
          }
        }
        return false;
      })
      .withMessage("Photo URL must be a valid URL or file path"),
  ];
};

module.exports = { caseValidationRules };
