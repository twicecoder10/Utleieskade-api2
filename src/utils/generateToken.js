const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (userId, validity, userType) => {
  const payload = {
    id: userId,
  };

  if (userType) payload.userType = userType;

  const options = {
    expiresIn: validity,
  };

  const token = jwt.sign(payload, JWT_SECRET, options);
  return token;
};

module.exports = { generateToken };
