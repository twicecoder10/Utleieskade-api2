/**
 * Migration: Add inspector action types to ActionLog.actionType enum
 * 
 * This migration adds missing action types for inspector actions to the ActionLog enum.
 * 
 * Usage:
 *   node src/migrations/addInspectorActionTypesToEnum.js
 */

const sequelize = require("../config/db");

async function addInspectorActionTypesToEnum() {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    if (!isPostgres) {
      console.log("⚠️  This migration is for PostgreSQL only.");
      console.log("For MySQL, you may need to manually update the enum or change to VARCHAR.");
      return;
    }

    console.log("🔧 Adding inspector action types to ActionLog.actionType enum...");

    // List of action types to add
    const actionTypesToAdd = [
      "case_claimed",
      "case_cancelled",
      "case_on_hold",
      "case_released",
      "case_completed",
      "report_submitted",
      "timer_started",
      "timer_stopped",
    ];

    // Check current enum values
    const [currentValues] = await sequelize.query(`
      SELECT enumlabel as value
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_ActionLog_actionType'
      )
      ORDER BY enumsortorder;
    `);

    const existingValues = currentValues.map(v => v.value);
    console.log(`📋 Current enum values: ${existingValues.join(", ")}`);

    // Add missing values
    let addedCount = 0;
    for (const actionType of actionTypesToAdd) {
      if (!existingValues.includes(actionType)) {
        try {
          await sequelize.query(`
            ALTER TYPE "enum_ActionLog_actionType" ADD VALUE '${actionType}';
          `);
          console.log(`✅ Added '${actionType}' to enum`);
          addedCount++;
        } catch (error) {
          // Value might already exist or other error
          if (error.message.includes("already exists")) {
            console.log(`ℹ️  '${actionType}' already exists in enum`);
          } else {
            console.warn(`⚠️  Error adding '${actionType}':`, error.message);
          }
        }
      } else {
        console.log(`ℹ️  '${actionType}' already exists in enum`);
      }
    }

    // Verify final enum values
    const [finalValues] = await sequelize.query(`
      SELECT enumlabel as value
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_ActionLog_actionType'
      )
      ORDER BY enumsortorder;
    `);

    console.log(`\n✅ Migration completed. Added ${addedCount} new values.`);
    console.log(`📋 Final enum values (${finalValues.length} total):`);
    finalValues.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.value}`);
    });

  } catch (error) {
    console.error("❌ Error adding action types to enum:", error.message);
    if (error.original) {
      console.error("   Original error:", error.original.message);
    }
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addInspectorActionTypesToEnum()
    .then(() => {
      console.log("\n✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = addInspectorActionTypesToEnum;

