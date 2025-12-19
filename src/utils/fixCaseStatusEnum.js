/**
 * Utility to fix Case Status Enum and migrate cases with invalid status
 * 
 * This function:
 * 1. Adds 'pending' to the enum if it doesn't exist
 * 2. Updates any cases with 'pending' status to 'open' (or another valid status)
 */

const { Case } = require("../models/index");
const sequelize = require("../config/db");

async function fixCaseStatusEnum() {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    if (!isPostgres) {
      console.log("⚠️  This fix is for PostgreSQL only.");
      return { success: false, message: "This fix is for PostgreSQL only" };
    }

    console.log("🔧 Fixing Case Status Enum...");

    // Step 1: Check if 'pending' exists in the enum
    const [checkResults] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending' 
        AND enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'enum_Case_caseStatus'
        )
      ) as exists;
    `);

    const pendingExists = checkResults[0].exists;
    let enumAdded = false;

    // Step 2: Add 'pending' to enum if it doesn't exist
    if (!pendingExists) {
      try {
        await sequelize.query(`
          ALTER TYPE "enum_Case_caseStatus" ADD VALUE IF NOT EXISTS 'pending';
        `);
        enumAdded = true;
        console.log("✅ Successfully added 'pending' to enum_Case_caseStatus");
      } catch (error) {
        // IF NOT EXISTS might not be supported in older PostgreSQL versions
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log("ℹ️  'pending' already exists in enum (or was just added)");
          enumAdded = true;
        } else {
          // Try without IF NOT EXISTS
          try {
            await sequelize.query(`
              ALTER TYPE "enum_Case_caseStatus" ADD VALUE 'pending';
            `);
            enumAdded = true;
            console.log("✅ Successfully added 'pending' to enum_Case_caseStatus");
          } catch (err2) {
            if (err2.message.includes('already exists') || err2.message.includes('duplicate')) {
              console.log("ℹ️  'pending' already exists in enum");
              enumAdded = true;
            } else {
              throw err2;
            }
          }
        }
      }
    } else {
      console.log("✅ 'pending' already exists in enum_Case_caseStatus");
      enumAdded = true;
    }

    // Step 3: After adding 'pending' to enum, verify all cases are valid
    // Check for any cases that might still have issues (this is a safety check)
    let casesUpdated = 0;
    try {
      const [casesWithIssues] = await sequelize.query(`
        SELECT "caseId", "caseStatus"::text as status
        FROM "Case"
        WHERE "caseStatus"::text NOT IN ('open', 'completed', 'cancelled', 'on-hold', 'pending', 'in-progress')
        LIMIT 100;
      `);

      if (casesWithIssues && casesWithIssues.length > 0) {
        console.log(`⚠️  Found ${casesWithIssues.length} cases with potentially invalid status`);
        // Update them to 'open' as a safe default using raw SQL
        for (const caseItem of casesWithIssues) {
          try {
            await sequelize.query(`
              UPDATE "Case" 
              SET "caseStatus" = 'open'::"enum_Case_caseStatus"
              WHERE "caseId" = :caseId
            `, {
              replacements: { caseId: caseItem.caseId }
            });
            casesUpdated++;
          } catch (error) {
            console.error(`❌ Failed to update case ${caseItem.caseId}:`, error.message);
          }
        }
        if (casesUpdated > 0) {
          console.log(`✅ Updated ${casesUpdated} cases to 'open' status`);
        }
      }
    } catch (checkError) {
      console.log("ℹ️  Could not check for invalid cases (this is okay if enum was just fixed)");
    }

    // Step 4: Verify the enum values
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel as case_status_value 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_Case_caseStatus')
      ORDER BY enumsortorder;
    `);

    const validStatuses = enumValues.map(row => row.case_status_value);

    return {
      success: true,
      enumAdded,
      casesUpdated,
      validStatuses,
      message: `Enum fix completed. ${enumAdded ? "Added 'pending' to enum." : "Enum already had 'pending'."} ${casesUpdated > 0 ? `Updated ${casesUpdated} cases.` : ""}`
    };

  } catch (error) {
    console.error("❌ Error fixing enum:", error.message);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

module.exports = fixCaseStatusEnum;

