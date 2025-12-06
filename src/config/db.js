const { Sequelize } = require("sequelize");
const { dbPort, dbName, dbUser, dbPassword, dbHost, dbDialect } = require("./env");

// Determine if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Database configuration
const isPostgres = dbDialect === "postgres";

const dbConfig = {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect,
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
    ? isPostgres
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Railway uses self-signed certificates
          },
        }
      : {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Railway uses self-signed certificates
          },
        }
    : {},
};

// Set dialect module based on database type
if (isPostgres) {
  // PostgreSQL
  dbConfig.dialectModule = require("pg");
} else {
  // MySQL
  dbConfig.dialectModule = require("mysql2");
}

const sequelize = new Sequelize(dbName, dbUser, dbPassword, dbConfig);

// Enhanced connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log(`✅ Connected to ${dbName} database successfully.`);
      console.log(`   Type: ${isPostgres ? "PostgreSQL" : "MySQL"}`);
      console.log(`   Host: ${dbHost}:${dbPort}`);
      return;
    } catch (error) {
      console.error(`❌ Unable to connect to database (attempt ${i + 1}/${retries}):`, error.message);
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
      if (error.original) {
        console.error(`   Original error: ${error.original.message || error.original}`);
      }
      
      if (i < retries - 1) {
        console.log(`   Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("❌ Failed to connect to database after all retries.");
        console.error("   Connection details:");
        console.error(`   - Host: ${dbHost || "NOT SET"}`);
        console.error(`   - Port: ${dbPort || "NOT SET"}`);
        console.error(`   - Database: ${dbName || "NOT SET"}`);
        console.error(`   - User: ${dbUser || "NOT SET"}`);
        console.error(`   - Dialect: ${dbDialect || "postgres"}`);
        console.error(`   - SSL Required: ${isProduction ? "Yes" : "No"}`);
        console.error("   Please check your database configuration and ensure:");
        console.error("   - Database service is running");
        console.error("   - Environment variables are set correctly");
        console.error("   - Network/firewall allows connections");
        console.error("   - SSL configuration is correct (if required)");
        throw error;
      }
    }
  }
};

// Export a promise that resolves when connected
// Never throw - always resolve/reject gracefully to prevent server crash
const connectionPromise = connectWithRetry().catch((error) => {
  console.error("⚠️ Database connection error (non-fatal):", error.message);
  console.error("Full error details:", {
    message: error.message,
    code: error.code,
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    dialect: dbDialect,
  });
  // Return a rejected promise but don't throw - let server.js handle it
  return Promise.reject(error);
});

// Export sequelize for backward compatibility with models
module.exports = sequelize;
// Also export connectionPromise for server.js
module.exports.connectionPromise = connectionPromise;
