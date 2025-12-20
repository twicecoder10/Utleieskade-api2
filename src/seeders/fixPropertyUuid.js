/**
 * Emergency fix script to convert Property.propertyId from UUID to VARCHAR(255)
 * Run this with: node src/seeders/fixPropertyUuid.js
 */

require("dotenv").config();
const sequelize = require("../config/db");

const fixPropertyUuid = async () => {
  try {
    console.log("🔍 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    console.log("🔍 Checking Property.propertyId column type...");
    
    // Check current column type
    const [columnInfo] = await sequelize.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'Property' 
      AND column_name = 'propertyId';
    `);

    if (columnInfo.length === 0) {
      console.log("❌ Property table or propertyId column not found!");
      process.exit(1);
    }

    const currentType = columnInfo[0].udt_name || columnInfo[0].data_type;
    console.log(`📊 Current propertyId type: ${currentType} (data_type: ${columnInfo[0].data_type}, udt_name: ${columnInfo[0].udt_name})`);

    if (currentType === "uuid") {
      console.log("🔄 Property.propertyId is UUID. Converting to VARCHAR(255)...");
      
      // Step 1: Drop foreign key constraint
      console.log("📋 Step 1: Dropping foreign key constraint...");
      await sequelize.query(`
        ALTER TABLE "Case" DROP CONSTRAINT IF EXISTS "Case_propertyId_fkey";
      `);
      console.log("✅ Foreign key constraint dropped");

      // Step 2: Convert column type
      console.log("📋 Step 2: Converting column type from UUID to VARCHAR(255)...");
      await sequelize.query(`
        ALTER TABLE "Property" 
        ALTER COLUMN "propertyId" TYPE VARCHAR(255) 
        USING "propertyId"::text;
      `);
      console.log("✅ Column type converted to VARCHAR(255)");

      // Step 3: Recreate foreign key constraint
      console.log("📋 Step 3: Recreating foreign key constraint...");
      await sequelize.query(`
        ALTER TABLE "Case" 
        ADD CONSTRAINT "Case_propertyId_fkey" 
        FOREIGN KEY ("propertyId") 
        REFERENCES "Property"("propertyId") 
        ON DELETE CASCADE;
      `);
      console.log("✅ Foreign key constraint recreated");

      // Verify the change
      console.log("🔍 Verifying the change...");
      const [verifyInfo] = await sequelize.query(`
        SELECT data_type, udt_name
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'Property' 
        AND column_name = 'propertyId';
      `);
      
      const newType = verifyInfo[0].udt_name || verifyInfo[0].data_type;
      console.log(`📊 New propertyId type: ${newType}`);
      
      if (newType === "varchar" || newType === "character varying") {
        console.log("✅ Migration completed successfully! Property.propertyId is now VARCHAR(255)");
      } else {
        console.log("⚠️  Warning: Column type might not have changed correctly");
      }
    } else {
      console.log(`ℹ️  Property.propertyId is already ${currentType}. No migration needed.`);
    }

    console.log("✅ Fix script completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running fix script:", error.message);
    console.error("Error details:", {
      name: error.name,
      code: error.code,
      sql: error.sql,
    });
    if (error.original) {
      console.error("Original error:", error.original.message);
    }
    process.exit(1);
  }
};

// Run the fix
fixPropertyUuid();


