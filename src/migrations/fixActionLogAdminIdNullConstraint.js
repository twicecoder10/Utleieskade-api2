/**
 * Migration: Fix ActionLog to support both admin and inspector actions
 * 
 * This migration makes both adminId and inspectorId nullable in the ActionLog table,
 * allowing it to track actions from both admins and inspectors. A check constraint
 * ensures that at least one of adminId or inspectorId must be set.
 * 
 * Usage:
 *   node src/migrations/fixActionLogAdminIdNullConstraint.js
 *   DATABASE_URL="postgresql://..." node src/migrations/fixActionLogAdminIdNullConstraint.js
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

async function fixActionLogAdminIdConstraint() {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    console.log("🔧 Fixing ActionLog to support both admin and inspector actions...");

    // Check if ActionLog table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ActionLog'
      ) as exists;
    `);

    if (!tableExists[0].exists) {
      console.log("⚠️  ActionLog table does not exist. Please create it first.");
      return;
    }

    // Check if adminId column exists
    const [columnExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ActionLog' AND column_name = 'adminId'
      ) as exists;
    `);

    if (isPostgres) {
      // Make adminId nullable
      if (columnExists[0].exists) {
        console.log("⚠️  Making adminId column nullable...");
        await sequelize.query(`
          ALTER TABLE "ActionLog" 
          ALTER COLUMN "adminId" DROP NOT NULL;
        `);
        console.log("✅ Made adminId column nullable");
      } else {
        console.log("⚠️  Adding adminId column as nullable...");
        await sequelize.query(`
          ALTER TABLE "ActionLog" 
          ADD COLUMN "adminId" VARCHAR(255) NULL;
        `);
        console.log("✅ Added adminId column as nullable");
      }

      // Make inspectorId nullable (should already be, but just in case)
      const [inspectorIdExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ActionLog' 
          AND column_name = 'inspectorId' 
          AND is_nullable = 'NO'
        ) as exists;
      `);
      
      if (inspectorIdExists[0].exists) {
        console.log("⚠️  Making inspectorId column nullable...");
        await sequelize.query(`
          ALTER TABLE "ActionLog" 
          ALTER COLUMN "inspectorId" DROP NOT NULL;
        `);
        console.log("✅ Made inspectorId column nullable");
      }

      // Add check constraint: at least one of adminId or inspectorId must be set
      console.log("⚠️  Adding check constraint...");
      try {
        // Drop existing constraint if it exists
        await sequelize.query(`
          ALTER TABLE "ActionLog" 
          DROP CONSTRAINT IF EXISTS "ActionLog_adminId_or_inspectorId_check";
        `);
      } catch (e) {
        // Ignore if constraint doesn't exist
      }
      
      await sequelize.query(`
        ALTER TABLE "ActionLog" 
        ADD CONSTRAINT "ActionLog_adminId_or_inspectorId_check" 
        CHECK (("adminId" IS NOT NULL) OR ("inspectorId" IS NOT NULL));
      `);
      console.log("✅ Added check constraint: at least one of adminId or inspectorId must be set");

      // Create index on adminId for faster queries
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS "ActionLog_adminId_idx" ON "ActionLog" ("adminId");
      `);
    } else {
      // MySQL
      if (columnExists[0].exists) {
        console.log("⚠️  Making adminId column nullable...");
        await sequelize.query(`
          ALTER TABLE ActionLog 
          MODIFY COLUMN adminId VARCHAR(255) NULL;
        `);
        console.log("✅ Made adminId column nullable");
      } else {
        console.log("⚠️  Adding adminId column as nullable...");
        await sequelize.query(`
          ALTER TABLE ActionLog 
          ADD COLUMN adminId VARCHAR(255) NULL;
        `);
        console.log("✅ Added adminId column as nullable");
      }

      // Make inspectorId nullable if needed
      const [inspectorIdInfo] = await sequelize.query(`
        SELECT IS_NULLABLE 
        FROM information_schema.columns 
        WHERE table_name = 'ActionLog' 
        AND column_name = 'inspectorId' 
        AND table_schema = DATABASE();
      `);
      
      if (inspectorIdInfo[0] && inspectorIdInfo[0].IS_NULLABLE === 'NO') {
        console.log("⚠️  Making inspectorId column nullable...");
        await sequelize.query(`
          ALTER TABLE ActionLog 
          MODIFY COLUMN inspectorId VARCHAR(255) NULL;
        `);
        console.log("✅ Made inspectorId column nullable");
      }

      // MySQL check constraint
      console.log("⚠️  Adding check constraint...");
      try {
        await sequelize.query(`
          ALTER TABLE ActionLog 
          DROP CHECK IF EXISTS ActionLog_adminId_or_inspectorId_check;
        `);
      } catch (e) {
        // Ignore if constraint doesn't exist
      }
      
      await sequelize.query(`
        ALTER TABLE ActionLog 
        ADD CONSTRAINT ActionLog_adminId_or_inspectorId_check 
        CHECK ((adminId IS NOT NULL) OR (inspectorId IS NOT NULL));
      `);
      console.log("✅ Added check constraint: at least one of adminId or inspectorId must be set");

      // Create index on adminId
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS ActionLog_adminId_idx ON ActionLog (adminId);
      `);
    }

    console.log("✅ Successfully updated ActionLog to support both admin and inspector actions");

    // Verify table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'ActionLog'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 ActionLog table structure:");
    columns.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });

  } catch (error) {
    console.error("❌ Error fixing ActionLog constraints:", error.message);
    if (error.original) {
      console.error("   Original error:", error.original.message);
    }
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  fixActionLogAdminIdConstraint()
    .then(() => {
      console.log("\n✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = fixActionLogAdminIdConstraint;

