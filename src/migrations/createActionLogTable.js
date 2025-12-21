/**
 * Migration: Create ActionLog table
 * 
 * This migration creates the ActionLog table to store inspector action logs.
 * 
 * Usage:
 *   node src/migrations/createActionLogTable.js
 *   DATABASE_URL="postgresql://..." node src/migrations/createActionLogTable.js
 */

const { Sequelize } = require("sequelize");

// Use provided DATABASE_URL or fall back to default config
let sequelize;
if (process.env.DATABASE_URL) {
  // Use provided connection URL (useful for production/public URLs)
  const url = new URL(process.env.DATABASE_URL);
  const isPostgres = url.protocol === "postgresql:" || url.protocol === "postgres:";
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: isPostgres ? "postgres" : "mysql",
    dialectModule: isPostgres ? require("pg") : require("mysql2"),
    logging: false,
    dialectOptions: isPostgres ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
  });
} else {
  // Use default config from config/db.js
  sequelize = require("../config/db");
}

async function createActionLogTable() {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    console.log("🔧 Creating ActionLog table...");

    // Check if table already exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ActionLog'
      ) as exists;
    `);

    if (tableExists[0].exists) {
      console.log("✅ ActionLog table already exists");
      
      // Check if inspectorId column exists
      const [inspectorIdExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ActionLog' AND column_name = 'inspectorId'
        ) as exists;
      `);

      // Check if caseId column exists
      const [caseIdExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ActionLog' AND column_name = 'caseId'
        ) as exists;
      `);

      let columnsAdded = false;

      // Add inspectorId column if it doesn't exist
      if (!inspectorIdExists[0].exists) {
        console.log("⚠️  Adding missing inspectorId column...");
        if (isPostgres) {
          await sequelize.query(`
            ALTER TABLE "ActionLog" 
            ADD COLUMN "inspectorId" VARCHAR(255);
          `);
          await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "ActionLog_inspectorId_idx" ON "ActionLog" ("inspectorId");
          `);
        } else {
          await sequelize.query(`
            ALTER TABLE ActionLog 
            ADD COLUMN inspectorId VARCHAR(255);
          `);
          await sequelize.query(`
            CREATE INDEX IF NOT EXISTS ActionLog_inspectorId_idx ON ActionLog (inspectorId);
          `);
        }
        columnsAdded = true;
      }

      // Add caseId column if it doesn't exist
      if (!caseIdExists[0].exists) {
        console.log("⚠️  Adding missing caseId column...");
        if (isPostgres) {
          await sequelize.query(`
            ALTER TABLE "ActionLog" 
            ADD COLUMN "caseId" VARCHAR(255);
          `);
          await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "ActionLog_caseId_idx" ON "ActionLog" ("caseId");
          `);
        } else {
          await sequelize.query(`
            ALTER TABLE ActionLog 
            ADD COLUMN caseId VARCHAR(255);
          `);
          await sequelize.query(`
            CREATE INDEX IF NOT EXISTS ActionLog_caseId_idx ON ActionLog (caseId);
          `);
        }
        columnsAdded = true;
      }

      if (columnsAdded) {
        console.log("✅ Successfully added missing columns to ActionLog table");
      } else {
        console.log("✅ ActionLog table has all required columns");
      }
      return;
    }

    if (isPostgres) {
      // Create table for PostgreSQL - Sequelize will handle UUID generation
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "ActionLog" (
          "logId" UUID PRIMARY KEY,
          "inspectorId" VARCHAR(255) NOT NULL,
          "actionType" VARCHAR(255) NOT NULL,
          "actionDescription" TEXT NOT NULL,
          "caseId" VARCHAR(255),
          "metadata" JSONB,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);

      // Create indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS "ActionLog_inspectorId_idx" ON "ActionLog" ("inspectorId");
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS "ActionLog_caseId_idx" ON "ActionLog" ("caseId");
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS "ActionLog_actionType_idx" ON "ActionLog" ("actionType");
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS "ActionLog_createdAt_idx" ON "ActionLog" ("createdAt" DESC);
      `);
    } else {
      // For MySQL, let Sequelize sync handle it, or create basic structure
      console.log("⚠️  MySQL detected. Consider using Sequelize sync or manual table creation.");
      console.log("   For now, trying to create table structure...");
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS ActionLog (
          logId CHAR(36) PRIMARY KEY,
          inspectorId VARCHAR(255) NOT NULL,
          actionType VARCHAR(255) NOT NULL,
          actionDescription TEXT NOT NULL,
          caseId VARCHAR(255),
          metadata JSON,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX ActionLog_inspectorId_idx (inspectorId),
          INDEX ActionLog_caseId_idx (caseId),
          INDEX ActionLog_actionType_idx (actionType),
          INDEX ActionLog_createdAt_idx (createdAt DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    }

    console.log("✅ Successfully created ActionLog table with indexes");

    // Verify table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ActionLog'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 ActionLog table structure:");
    columns.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error("❌ Error creating ActionLog table:", error.message);
    if (error.original) {
      console.error("   Original error:", error.original.message);
    }
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createActionLogTable()
    .then(() => {
      console.log("\n✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = createActionLogTable;

