/**
 * Migration: Fix InspectorPayment paymentAmount column type
 * 
 * This migration converts the paymentAmount column from VARCHAR to DECIMAL(10, 2)
 * to fix PostgreSQL errors when using SUM() function.
 * 
 * Usage:
 *   node src/migrations/fixInspectorPaymentAmountType.js
 *   DATABASE_URL="postgresql://..." node src/migrations/fixInspectorPaymentAmountType.js
 */

const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Use provided DATABASE_URL or fall back to default config
let sequelize;
if (process.env.DATABASE_URL) {
  // Use provided connection URL (useful for production/public URLs)
  const url = new URL(process.env.DATABASE_URL);
  const isPostgres = url.protocol === "postgresql:" || url.protocol === "postgres:";
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: isPostgres ? "postgres" : "mysql",
    dialectModule: isPostgres ? require("pg") : require("mysql2"),
    logging: console.log,
    dialectOptions: isPostgres ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
  });
} else {
  // Use default config from config/db.js
  const dbConfig = require("../config/db");
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: console.log,
    dialectOptions: dbConfig.dialectOptions || {},
  });
}

async function runMigration() {
  try {
    console.log("🔧 Starting migration: Fix InspectorPayment paymentAmount column type...");
    
    // Check if this is PostgreSQL
    const dialect = sequelize.getDialect();
    if (dialect !== "postgres") {
      console.log("ℹ️  This migration is for PostgreSQL. Current dialect:", dialect);
      console.log("   For other databases, please run the appropriate SQL migration manually.");
      await sequelize.close();
      return;
    }

    // Read and execute the SQL migration
    const sqlPath = path.join(__dirname, "fixInspectorPaymentAmountType.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("📝 Executing SQL migration...");
    await sequelize.query(sql);

    console.log("✅ Migration completed successfully!");
    console.log("   paymentAmount column has been converted to DECIMAL(10, 2)");
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;

