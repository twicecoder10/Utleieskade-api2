/**
 * Migration: Add 'pending' to Case.caseStatus enum
 * 
 * This fixes the error: "invalid input value for enum enum case case status pending"
 * 
 * Run this migration to add 'pending' as a valid case status value in the database.
 * 
 * Usage:
 *   node api/src/migrations/add-pending-to-case-status-enum.js
 * 
 * Or run the SQL directly in your database:
 *   See: api/src/migrations/add-pending-to-case-status-enum.sql
 */

const sequelize = require("../config/db");

async function addPendingToCaseStatusEnum() {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    if (!isPostgres) {
      console.log("⚠️  This migration is for PostgreSQL only.");
      console.log("For other databases, you may need to manually update the enum.");
      return;
    }

    console.log("🔧 Adding 'pending' to Case.caseStatus enum...");

    // Check if 'pending' already exists in the enum
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending' 
        AND enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'enum_Case_caseStatus'
        )
      ) as exists;
    `);

    if (results[0].exists) {
      console.log("✅ 'pending' already exists in enum_Case_caseStatus");
      return;
    }

    // Add 'pending' to the enum
    await sequelize.query(`
      ALTER TYPE "enum_Case_caseStatus" ADD VALUE 'pending';
    `);

    console.log("✅ Successfully added 'pending' to enum_Case_caseStatus");

    // Verify the enum values
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel as case_status_value 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_Case_caseStatus')
      ORDER BY enumsortorder;
    `);

    console.log("\n📋 Current Case Status enum values:");
    enumValues.forEach((row) => {
      console.log(`   - ${row.case_status_value}`);
    });

  } catch (error) {
    console.error("❌ Error adding 'pending' to enum:", error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addPendingToCaseStatusEnum()
    .then(() => {
      console.log("\n✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = addPendingToCaseStatusEnum;

