const path = require("path");

const sanitizeFilePath = (req, res, next) => {
  req.params.filePath = path.normalize(req.params.filePath).replace(/^(\.\.(\/|\\|$))+/, "");
  next();
};

module.exports = { sanitizeFilePath };