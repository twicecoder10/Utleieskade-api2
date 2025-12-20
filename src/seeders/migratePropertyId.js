const sequelize = require("../config/db");

/**
 * Migration script to change Property.propertyId from UUID to STRING
 * This fixes the issue where propertyId was defined as UUID but we're using string IDs
 */
const migratePropertyId = async () => {
  try {
    console.log("🔄 Starting Property.propertyId migration...");

    const queryInterface = sequelize.getQueryInterface();
    const isPostgres = sequelize.getDialect() === "postgres";

    // Check if Property table exists
    const [results] = await sequelize.query(
      isPostgres
        ? `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'Property'
          );`
        : `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'Property'
          );`
    );

    const tableExists = isPostgres ? results[0].exists : results[0]["EXISTS"];

    if (!tableExists) {
      console.log("ℹ️  Property table does not exist. Migration not needed.");
      return;
    }

    // Check current column type
    const [columnInfo] = await sequelize.query(
      isPostgres
        ? `SELECT data_type 
           FROM information_schema.columns 
           WHERE table_name = 'Property' 
           AND column_name = 'propertyId';`
        : `SELECT DATA_TYPE 
           FROM information_schema.columns 
           WHERE table_name = 'Property' 
           AND column_name = 'propertyId';`
    );

    if (columnInfo.length === 0) {
      console.log("ℹ️  propertyId column does not exist. Migration not needed.");
      return;
    }

    const currentType = isPostgres
      ? columnInfo[0].data_type
      : columnInfo[0].DATA_TYPE;

    console.log(`📊 Current propertyId type: ${currentType}`);

    if (currentType === "uuid" || currentType === "char" || currentType === "varchar") {
      if (currentType === "uuid") {
        console.log("⚠️  Converting propertyId from UUID to VARCHAR...");

        // For PostgreSQL: Alter column type from UUID to VARCHAR
        if (isPostgres) {
          // First, we need to handle any existing data
          // Since UUIDs can't be directly converted to our string format,
          // we'll need to drop and recreate if there's data, or just alter if empty
          
          // Check if table has data
          const [rowCount] = await sequelize.query(
            `SELECT COUNT(*) as count FROM "Property";`
          );
          const count = parseInt(rowCount[0].count);

          if (count > 0) {
            console.log(`⚠️  Property table has ${count} rows.`);
            console.log("⚠️  WARNING: This migration will convert existing UUIDs to strings.");
            console.log("⚠️  If you have important data, backup first!");
            
            // Convert existing UUIDs to string format by casting
            // We'll generate new IDs for existing properties
            await sequelize.query(`
              ALTER TABLE "Property" 
              ALTER COLUMN "propertyId" TYPE VARCHAR(255) 
              USING "propertyId"::text;
            `);
          } else {
            // No data, safe to alter
            await sequelize.query(`
              ALTER TABLE "Property" 
              ALTER COLUMN "propertyId" TYPE VARCHAR(255);
            `);
          }
        } else {
          // MySQL
          await sequelize.query(`
            ALTER TABLE Property 
            MODIFY COLUMN propertyId VARCHAR(255) NOT NULL;
          `);
        }

        console.log("✅ Successfully converted propertyId from UUID to VARCHAR");
      } else {
        console.log("ℹ️  propertyId is already VARCHAR/STRING. No migration needed.");
      }
    } else {
      console.log(`ℹ️  propertyId type is ${currentType}. No migration needed.`);
    }

    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    console.error("Full error:", error.message);
    if (error.original) {
      console.error("Original error:", error.original.message);
    }
    process.exit(1);
  }
};

// Run migration
migratePropertyId();


