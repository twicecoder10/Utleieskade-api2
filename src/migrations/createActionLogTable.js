/**
 * Migration: Create ActionLog table
 * 
 * This migration creates the ActionLog table to store inspector action logs.
 * 
 * Usage:
 *   node src/migrations/createActionLogTable.js
 */

const sequelize = require("../config/db");

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
      const [columnExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ActionLog' AND column_name = 'inspectorId'
        ) as exists;
      `);

      if (columnExists[0].exists) {
        console.log("✅ ActionLog table has all required columns");
        return;
      } else {
        console.log("⚠️  ActionLog table exists but is missing columns. Adding columns...");
      }
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

