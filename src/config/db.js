const { Sequelize } = require("sequelize");
const { dbPort, dbName, dbUser, dbPassword, dbHost } = require("./env");

// Determine if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Database configuration
const dbConfig = {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  dialectModule: require("mysql2"),
  logging: false,
  // Connection pool settings for production
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  // SSL configuration for production (Railway requires SSL)
  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Railway uses self-signed certificates
        },
      }
    : {},
};

const sequelize = new Sequelize(dbName, dbUser, dbPassword, dbConfig);

// Enhanced connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log(`✅ Connected to ${dbName} database successfully.`);
      console.log(`   Host: ${dbHost}:${dbPort}`);
      return;
    } catch (error) {
      console.error(`❌ Unable to connect to database (attempt ${i + 1}/${retries}):`, error.message);
      
      if (i < retries - 1) {
        console.log(`   Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("❌ Failed to connect to database after all retries.");
        console.error("   Please check your database configuration and ensure:");
        console.error("   - Database service is running");
        console.error("   - Environment variables are set correctly");
        console.error("   - Network/firewall allows connections");
        throw error;
      }
    }
  }
};

// Connect to database
connectWithRetry().catch((error) => {
  console.error("Fatal database connection error:", error);
  // Don't exit process in production, let the app handle it
  if (!isProduction) {
    process.exit(1);
  }
});

module.exports = sequelize;
