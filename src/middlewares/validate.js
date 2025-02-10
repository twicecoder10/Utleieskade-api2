const { validationResult } = require("express-validator");
const responseHandler = require("../utils/responseHandler");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    responseHandler.setError(400, { errors: errors.array() });
    return responseHandler.send(res);
  }
  next();
};

module.exports = { validate };
