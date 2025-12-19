const { validationResult } = require("express-validator");
const responseHandler = require("../utils/responseHandler");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg || err.message || JSON.stringify(err)).join(", ");
    console.error("[Validation] Validation errors:", errors.array());
    console.error("[Validation] Request path:", req.path);
    console.error("[Validation] Request body:", JSON.stringify(req.body, null, 2));
    responseHandler.setError(400, errorMessages || "Validation error");
    return responseHandler.send(res);
  }
  next();
};

module.exports = { validate };
