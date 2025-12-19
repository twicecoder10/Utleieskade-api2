const errorMiddleware = (err, req, res, next) => {
  // Ensure CORS headers are set even in error responses
  const allowedOrigins = [
    "https://utleieskade-admin.vercel.app",
    "https://utleieskade-inspector.vercel.app",
    "https://utleieskade-tenant.vercel.app",
    "https://utleieskade-landing.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
    res.setHeader("Access-Control-Expose-Headers", "Content-Type, Authorization");
  }
  
  console.error("Error middleware:", err.stack || err.message || err);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
