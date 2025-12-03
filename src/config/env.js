const dotenv = require("dotenv");

dotenv.config();

// Support both standard env vars and Railway-specific vars
// Railway PostgreSQL uses: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// Railway MySQL uses: MYSQL_HOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
// Also support DATABASE_URL format if provided
const getDbConfig = () => {
  // If DATABASE_URL is provided, parse it
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      // Detect database type from URL scheme
      const isPostgres = url.protocol === "postgresql:" || url.protocol === "postgres:";
      return {
        dbHost: url.hostname,
        dbPort: parseInt(url.port) || (isPostgres ? 5432 : 3306),
        dbName: url.pathname.slice(1) || url.pathname.substring(1), // Remove leading '/'
        dbUser: url.username,
        dbPassword: url.password,
        dbDialect: isPostgres ? "postgres" : "mysql",
      };
    } catch (error) {
      console.error("Error parsing DATABASE_URL:", error.message);
    }
  }

  // Check for PostgreSQL variables first (Railway PostgreSQL)
  const hasPostgresVars = process.env.PGHOST || process.env.PGDATABASE;
  const hasMysqlVars = process.env.MYSQL_HOST || process.env.MYSQLDATABASE;

  let config;
  if (hasPostgresVars) {
    // PostgreSQL configuration (Railway PostgreSQL)
    config = {
      dbHost: process.env.PGHOST || process.env.DATABASE_HOST,
      dbPort: parseInt(process.env.PGPORT || process.env.DATABASE_PORT || "5432"),
      dbName: process.env.PGDATABASE || process.env.DATABASE_NAME,
      dbUser: process.env.PGUSER || process.env.DATABASE_USER,
      dbPassword: process.env.PGPASSWORD || process.env.DATABASE_PASSWORD,
      dbDialect: "postgres",
    };
  } else if (hasMysqlVars) {
    // MySQL configuration (Railway MySQL)
    config = {
      dbHost: process.env.MYSQL_HOST || process.env.DATABASE_HOST,
      dbPort: parseInt(process.env.MYSQLPORT || process.env.DATABASE_PORT || "3306"),
      dbName: process.env.MYSQLDATABASE || process.env.DATABASE_NAME,
      dbUser: process.env.MYSQLUSER || process.env.DATABASE_USER,
      dbPassword: process.env.MYSQLPASSWORD || process.env.DATABASE_PASSWORD,
      dbDialect: "mysql",
    };
  } else {
    // Default to PostgreSQL if no specific vars found, use standard env vars
    config = {
      dbHost: process.env.DATABASE_HOST,
      dbPort: parseInt(process.env.DATABASE_PORT || "5432"),
      dbName: process.env.DATABASE_NAME,
      dbUser: process.env.DATABASE_USER,
      dbPassword: process.env.DATABASE_PASSWORD,
      dbDialect: "postgres", // Default to PostgreSQL
    };
  }

  // Validate required fields
  const missing = [];
  if (!config.dbHost) missing.push("DATABASE_HOST, PGHOST, or MYSQL_HOST");
  if (!config.dbName) missing.push("DATABASE_NAME, PGDATABASE, or MYSQLDATABASE");
  if (!config.dbUser) missing.push("DATABASE_USER, PGUSER, or MYSQLUSER");
  if (!config.dbPassword) missing.push("DATABASE_PASSWORD, PGPASSWORD, or MYSQLPASSWORD");

  if (missing.length > 0) {
    console.error("❌ Missing required database environment variables:");
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\n💡 Railway PostgreSQL provides: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD");
    console.error("💡 Railway MySQL provides: MYSQL_HOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD");
  }

  return config;
};

const config = getDbConfig();

// Log configuration (without password) for debugging
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  console.log("📊 Database Configuration:");
  console.log(`   Host: ${config.dbHost || "NOT SET"}`);
  console.log(`   Port: ${config.dbPort || "NOT SET"}`);
  console.log(`   Database: ${config.dbName || "NOT SET"}`);
  console.log(`   User: ${config.dbUser || "NOT SET"}`);
  console.log(`   Dialect: ${config.dbDialect || "postgres"}`);
  console.log(`   Password: ${config.dbPassword ? "***SET***" : "NOT SET"}`);
  console.log(`   Using DATABASE_URL: ${process.env.DATABASE_URL ? "Yes" : "No"}`);
  console.log(`   Using Railway PG vars: ${process.env.PGHOST || process.env.PGDATABASE ? "Yes" : "No"}`);
}

module.exports = {
  dbPort: config.dbPort,
  dbHost: config.dbHost,
  dbName: config.dbName,
  dbUser: config.dbUser,
  dbPassword: config.dbPassword,
  dbDialect: config.dbDialect || "postgres",
};
