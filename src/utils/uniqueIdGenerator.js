const crypto = require("crypto");

exports.generateUniqueId = (prefix) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = `${year}${month}`;

  const randomHex = crypto.randomBytes(4).toString("hex");
  return `${prefix}-${date}-${randomHex}`;
};
