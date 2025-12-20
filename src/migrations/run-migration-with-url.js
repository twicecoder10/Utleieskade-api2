/**
 * Migration Runner: Add 'basePrice' to PlatformSettings table
 * 
 * This script uses a direct database connection URL to run the migration.
 * 
 * Usage:
 *   DATABASE_PUBLIC_URL="your-connection-string" node src/migrations/run-migration-with-url.js
 * 
 * Or set it in your environment:
 *   export DATABASE_PUBLIC_URL="your-connection-string"
 *   node src/migrations/run-migration-with-url.js
 */

const { Sequelize } = require("sequelize");

// Get connection URL from environment or command line
const connectionUrl = process.env.DATABASE_PUBLIC_URL || process.argv[2];

if (!connectionUrl) {
  console.error("❌ Error: DATABASE_PUBLIC_URL environment variable or connection string argument is required");
  console.error("\nUsage:");
  console.error('  DATABASE_PUBLIC_URL="postgresql://..." node src/migrations/run-migration-with-url.js');
  console.error('  node src/migrations/run-migration-with-url.js "postgresql://..."');
  process.exit(1);
}

// Create Sequelize instance with the connection URL
const sequelize = new Sequelize(connectionUrl, {
  dialect: "postgres",
  dialectModule: require("pg"),
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Railway uses self-signed certificates
    },
  },
});

async function addBasePriceToPlatformSettings() {
  try {
    console.log("🔌 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected to database successfully\n");

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
    } else {
      // Add basePrice column
      await sequelize.query(`
        ALTER TABLE "PlatformSettings" 
        ADD COLUMN "basePrice" DECIMAL(10, 2) NOT NULL DEFAULT 100.0;
      `);

      console.log("✅ Successfully added 'basePrice' column to PlatformSettings");
    }

    // Update existing records with default value if needed
    await sequelize.query(`
      UPDATE "PlatformSettings" 
      SET "basePrice" = 100.0 
      WHERE "basePrice" IS NULL;
    `);

    console.log("✅ Updated existing records with default basePrice value");

    await sequelize.close();
    console.log("\n✅ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running migration:", error.message);
    if (error.original) {
      console.error("   Original error:", error.original.message);
    }
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}

// Run migration
addBasePriceToPlatformSettings();

