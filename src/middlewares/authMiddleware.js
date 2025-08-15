const responseHandler = require("../utils/responseHandler");
const { verifyToken } = require("../utils/verifyToken");

const authMiddleware = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    responseHandler.setError(
      401,
      "User not authorized, no token provided. Kindly login to continue"
    );
    return responseHandler.send(res);
  }

  if (authorizationHeader.startsWith("Bearer ")) {
    const token = authorizationHeader.split(" ")[1];

    try {
      const decoded = await verifyToken(token);
      req.user = decoded.message;
      next();
    } catch (error) {
      responseHandler.setError(400, error.message || "Invalid token.");
      return responseHandler.send(res);
    }
  } else {
    responseHandler.setError(401, "Invalid authorization format.");
    return responseHandler.send(res);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.userType === "admin") {
    next();
  } else {
    responseHandler.setError(403, "Access denied. Requires admin role.");
    return responseHandler.send(res);
  }
};

const isLandlord = (req, res, next) => {
  if (req.user.userType === "landlord") {
    next();
  } else {
    responseHandler.setError(403, "Access denied. Requires admin role.");
    return responseHandler.send(res);
  }
};

module.exports = { authMiddleware, isAdmin, isLandlord };
