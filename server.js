const appSetup = require("./src/app");
const sequelize = require("./src/config/db");

const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 3000;

// Wait for database connection before starting server
sequelize.connectionPromise
  .then(() => {
    const server = appSetup.app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    appSetup.socketIOSetup(server);
  })
  .catch((error) => {
    console.error("❌ Failed to start server due to database connection error:", error);
    process.exit(1);
  });