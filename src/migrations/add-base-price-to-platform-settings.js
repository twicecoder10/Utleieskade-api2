/**
 * Migration: Add 'basePrice' to PlatformSettings table
 * 
 * This adds the basePrice field to allow admins to configure the base price per room.
 * 
 * Usage:
 *   node api/src/migrations/add-base-price-to-platform-settings.js
 * 
 * Or run the SQL directly in your database:
 *   See: api/src/migrations/add-base-price-to-platform-settings.sql
 */

const sequelize = require("../config/db");

async function addBasePriceToPlatformSettings() {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    if (!isPostgres) {
      console.log("⚠️  This migration is for PostgreSQL only.");
      console.log("For other databases, you may need to manually update the table.");
      return;
    }

    console.log("🔧 Adding 'basePrice' column to PlatformSettings...");

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PlatformSettings' 
        AND column_name = 'basePrice'
      ) as exists;
    `);

    if (results[0].exists) {
      console.log("✅ 'basePrice' column already exists in PlatformSettings");
      return;
    }

    // Add basePrice column
    await sequelize.query(`
      ALTER TABLE "PlatformSettings" 
      ADD COLUMN "basePrice" DECIMAL(10, 2) NOT NULL DEFAULT 100.0;
    `);

    console.log("✅ Successfully added 'basePrice' column to PlatformSettings");

    // Update existing records with default value if needed
    await sequelize.query(`
      UPDATE "PlatformSettings" 
      SET "basePrice" = 100.0 
      WHERE "basePrice" IS NULL;
    `);

    console.log("✅ Updated existing records with default basePrice value");

  } catch (error) {
    console.error("❌ Error adding 'basePrice' column:", error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addBasePriceToPlatformSettings()
    .then(() => {
      console.log("\n✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = addBasePriceToPlatformSettings;

