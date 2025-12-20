/**
 * Utility script to fix TrackingTime table schema
 * This fixes the trackingTimeEnd NOT NULL constraint issue
 * Run this script: node src/utils/fixTrackingTimeSchema.js
 */

const sequelize = require("../config/db");

const fixTrackingTimeSchema = async () => {
  try {
    console.log("🔧 Fixing TrackingTime table constraints...");
    
    // Check if we're using PostgreSQL
    const dialect = sequelize.getDialect();
    if (dialect !== "postgres") {
      console.log("⚠️  This script is designed for PostgreSQL. Current dialect:", dialect);
      return;
    }

    // Fix trackingTimeEnd to allow NULL (logically, it should be NULL when starting a timer)
    try {
      await sequelize.query(`
        ALTER TABLE "TrackingTime" 
        ALTER COLUMN "trackingTimeEnd" DROP NOT NULL;
      `);
      console.log("✅ Successfully removed NOT NULL constraint from trackingTimeEnd");
    } catch (error) {
      if (error.message.includes("does not exist") || error.message.includes("constraint")) {
        console.log("ℹ️  trackingTimeEnd constraint may already be fixed or doesn't exist");
      } else {
        throw error;
      }
    }
    
    // Add caseId column if it doesn't exist
    try {
      const [caseIdCheck] = await sequelize.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TrackingTime' AND column_name = 'caseId'
      `);
      
      if (caseIdCheck.length === 0) {
        await sequelize.query(`
          ALTER TABLE "TrackingTime" ADD COLUMN "caseId" VARCHAR(255);
        `);
        console.log("✅ Successfully added caseId column");
      } else {
        console.log("ℹ️  caseId column already exists");
      }
    } catch (error) {
      console.warn("⚠️  Could not add caseId column:", error.message);
    }
    
    // Add isActive column if it doesn't exist
    try {
      const [isActiveCheck] = await sequelize.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TrackingTime' AND column_name = 'isActive'
      `);
      
      if (isActiveCheck.length === 0) {
        await sequelize.query(`
          ALTER TABLE "TrackingTime" ADD COLUMN "isActive" BOOLEAN DEFAULT false;
        `);
        console.log("✅ Successfully added isActive column");
      } else {
        console.log("ℹ️  isActive column already exists");
      }
    } catch (error) {
      console.warn("⚠️  Could not add isActive column:", error.message);
    }
    
    // Note: userId column exists in the database but is not in the Sequelize model
    // If userId is needed, it should be added to the model
    // For now, we'll leave it as nullable since it's not being used
    
    console.log("✅ Schema fix completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing schema:", error.message);
    
    // If the error is because the constraint doesn't exist, that's okay
    if (error.message.includes("does not exist") || error.message.includes("constraint")) {
      console.log("ℹ️  Constraint may already be fixed or doesn't exist");
      process.exit(0);
    }
    
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  fixTrackingTimeSchema()
    .then(() => {
      console.log("✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fatal error:", error);
      process.exit(1);
    });
}

module.exports = fixTrackingTimeSchema;

