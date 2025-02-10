const jwt = require("jsonwebtoken");

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    const secret = process.env.JWT_SECRET;
    jwt.verify(token, secret, (err, decodedToken) => {
      if (err) {
        console.error("Token verification error:", err);
        reject({ status: false, message: err.message });
      } else {
        resolve({ status: true, message: decodedToken });
      }
    });
  });
};

module.exports = { verifyToken };
