const dotenv = require("dotenv");
dotenv.config();

// Try to start server with error handling
try {
  const appSetup = require("./src/app");
  const sequelize = require("./src/config/db");

  const PORT = process.env.PORT || 3000;

  // Start server immediately, don't wait for database
  // This ensures the API responds even if DB connection fails
  const server = appSetup.app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`✅ API is ready to accept requests`);
  });

  // Handle server errors
  server.on("error", (error) => {
    console.error("❌ Server error:", error);
  });

  appSetup.socketIOSetup(server);

  // Attempt database connection (non-blocking)
  sequelize.connectionPromise
    .then(() => {
      console.log("✅ Database connection established");
    })
    .catch((error) => {
      console.error("⚠️ Database connection failed (server still running):", error.message);
      console.error("⚠️ API will respond but database operations will fail");
      // Don't exit - let server continue running
    });
} catch (error) {
  console.error("❌ Fatal error starting server:", error);
  console.error(error.stack);
  process.exit(1);
}