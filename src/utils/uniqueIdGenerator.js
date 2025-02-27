const crypto = require("crypto");

exports.generateUniqueId = (prefix) => {
  const date = new Date()
    .toISOString()
    .replace(/[-T:\.Z]/g, "")
    .slice(2, 12);
  const randomHex = crypto.randomBytes(2).toString("hex");
  return `${prefix}-${date}-${randomHex}`;
};
