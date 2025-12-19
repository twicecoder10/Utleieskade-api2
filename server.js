const dotenv = require("dotenv");
dotenv.config();

// Try to start server with error handling
try {
  // Initialize Azure Blob Storage if configured
  try {
    const { initializeAzureStorage } = require("./src/utils/azureStorage");
    initializeAzureStorage();
  } catch (azureError) {
    console.warn("⚠️  Azure storage initialization skipped:", azureError.message);
  }

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
  // Check if connectionPromise exists before using it
  if (sequelize.connectionPromise) {
    sequelize.connectionPromise
      .then(async () => {
        console.log("✅ Database connection established");
        // Run comprehensive UUID/STRING migration check
        try {
          const { migrateAllUuidMismatches } = require("./src/models");
          await migrateAllUuidMismatches();
        } catch (migrationError) {
          console.error("⚠️ UUID migration error (non-fatal):", migrationError.message);
        }
        // Run Case Status Enum fix
        try {
          const fixCaseStatusEnum = require("./src/utils/fixCaseStatusEnum");
          const enumFixResult = await fixCaseStatusEnum();
          if (enumFixResult.success) {
            console.log("✅ Case Status Enum check completed:", enumFixResult.message);
          } else {
            console.warn("⚠️ Case Status Enum fix warning (non-fatal):", enumFixResult.message);
          }
        } catch (enumError) {
          console.error("⚠️ Enum fix error (non-fatal):", enumError.message);
        }
      })
      .catch((error) => {
        console.error("⚠️ Database connection failed (server still running):", error?.message || error);
        console.error("⚠️ API will respond but database operations will fail");
        // Don't exit - let server continue running
      });
  } else {
    console.log("⚠️ Database connectionPromise not available - server running without DB");
  }
} catch (error) {
  console.error("❌ Fatal error starting server:", error);
  console.error(error.stack);
  process.exit(1);
}
