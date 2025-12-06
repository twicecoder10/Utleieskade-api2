const appSetup = require("./src/app");
const sequelize = require("./src/config/db");

const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server immediately, don't wait for database
// This ensures the API responds even if DB connection fails
const server = appSetup.app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
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