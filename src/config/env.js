const dotenv = require("dotenv");

dotenv.config();

// Support both standard env vars and Railway-specific vars
// Railway uses: MYSQL_HOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
// Also support DATABASE_URL format if provided
const getDbConfig = () => {
  // If DATABASE_URL is provided, parse it
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        dbHost: url.hostname,
        dbPort: parseInt(url.port) || 3306,
        dbName: url.pathname.slice(1) || url.pathname.substring(1), // Remove leading '/'
        dbUser: url.username,
        dbPassword: url.password,
      };
    } catch (error) {
      console.error("Error parsing DATABASE_URL:", error.message);
    }
  }

  // Otherwise, use individual env vars (Railway or standard)
  const config = {
    dbHost: process.env.MYSQL_HOST || process.env.DATABASE_HOST,
    dbPort: parseInt(process.env.MYSQLPORT || process.env.DATABASE_PORT || "3306"),
    dbName: process.env.MYSQLDATABASE || process.env.DATABASE_NAME,
    dbUser: process.env.MYSQLUSER || process.env.DATABASE_USER,
    dbPassword: process.env.MYSQLPASSWORD || process.env.DATABASE_PASSWORD,
  };

  // Validate required fields
  const missing = [];
  if (!config.dbHost) missing.push("DATABASE_HOST or MYSQL_HOST");
  if (!config.dbName) missing.push("DATABASE_NAME or MYSQLDATABASE");
  if (!config.dbUser) missing.push("DATABASE_USER or MYSQLUSER");
  if (!config.dbPassword) missing.push("DATABASE_PASSWORD or MYSQLPASSWORD");

  if (missing.length > 0) {
    console.error("❌ Missing required database environment variables:");
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\n💡 Railway provides these as: MYSQL_HOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD");
  }

  return config;
};

const config = getDbConfig();

module.exports = {
  dbPort: config.dbPort,
  dbHost: config.dbHost,
  dbName: config.dbName,
  dbUser: config.dbUser,
  dbPassword: config.dbPassword,
};
