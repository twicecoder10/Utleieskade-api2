const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  dbPort: process.env.DATABASE_PORT,
  dbHost: process.env.DATABASE_HOST,
  dbName: process.env.DATABASE_NAME,
  dbUser: process.env.DATABASE_USER,
  dbPassword: process.env.DATABASE_PASSWORD,
};
