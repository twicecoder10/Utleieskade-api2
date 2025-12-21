const sequelize = require("../config/db");

const User = require("./User");
const Case = require("./Case");
const CaseTimeline = require("./CaseTimeline");
const Damage = require("./Damage");
const Payment = require("./Payment");
const Report = require("./Report");
const Availability = require("./Availability");
const BankDetails = require("./BankDetails");
const Expertise = require("./Expertise");
const InspectorPayment = require("./InspectorPayment");
const ReportPhoto = require("./ReportPhoto");
const Property = require("./Property");
const Refund = require("./Refund");
const TrackingTime = require("./TrackingTime");
const Otp = require("./Otp");
const DamagePhoto = require("./DamagePhoto");
const NotificationSettings = require("./NotificationSettings");
const PrivacyPolicySettings = require("./PrivacyPolicySettings");
const PlatformSettings = require("./PlatformSettings");
const Conversation = require("./Conversation");
const Message = require("./Message");
const UserExpertise = require("./UserExpertise");
const AssessmentItem = require("./AssessmentItem");
const AssessmentSummary = require("./AssessmentSummary");
const ActionLog = require("./ActionLog");

// Comprehensive migration function to fix all UUID/STRING mismatches
// This ensures all foreign keys match their referenced primary key types
const migrateAllUuidMismatches = async () => {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    console.log("🔍 Running comprehensive UUID/STRING migration check...");
    
    // List of known foreign key relationships that should be STRING
    const stringForeignKeys = [
      { table: "Case", column: "propertyId", references: "Property.propertyId" },
      { table: "Case", column: "userId", references: "User.userId" },
      { table: "Case", column: "inspectorId", references: "User.userId" },
      { table: "Case", column: "caseId", references: null }, // Primary key
      { table: "Damage", column: "caseId", references: "Case.caseId" },
      { table: "CaseTimeline", column: "caseId", references: "Case.caseId" },
      { table: "Payment", column: "caseId", references: "Case.caseId" },
      { table: "Report", column: "caseId", references: "Case.caseId" },
      { table: "Report", column: "inspectorId", references: "User.userId" },
      { table: "Refund", column: "caseId", references: "Case.caseId" },
      { table: "BankDetails", column: "userId", references: "User.userId" },
      { table: "Availability", column: "inspectorId", references: "User.userId" },
      { table: "TrackingTime", column: "inspectorId", references: "User.userId" },
      { table: "Otp", column: "userId", references: "User.userId" },
      { table: "Conversation", column: "userOne", references: "User.userId" },
      { table: "Conversation", column: "userTwo", references: "User.userId" },
      { table: "Message", column: "senderId", references: "User.userId" },
      { table: "Message", column: "receiverId", references: "User.userId" },
    ];

    for (const fk of stringForeignKeys) {
      try {
        // Check if table exists
        const [tableExists] = await sequelize.query(
          isPostgres
            ? `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '${fk.table}'
              ) as exists;`
            : `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = '${fk.table}'
              ) as exists;`
        );

        if (!tableExists[0].exists) {
          continue; // Table doesn't exist yet
        }

        // Check column type
        const [columnInfo] = await sequelize.query(
          isPostgres
            ? `SELECT data_type, udt_name
               FROM information_schema.columns 
               WHERE table_schema = 'public'
               AND table_name = '${fk.table}' 
               AND column_name = '${fk.column}';`
            : `SELECT DATA_TYPE 
               FROM information_schema.columns 
               WHERE table_name = '${fk.table}' 
               AND column_name = '${fk.column}';`
        );

        if (columnInfo.length === 0) {
          continue; // Column doesn't exist
        }

        const currentType = isPostgres
          ? (columnInfo[0].udt_name || columnInfo[0].data_type)
          : columnInfo[0].DATA_TYPE;

        // Check if it's UUID but should be STRING
        const isUuidType = currentType === "uuid" || 
                           (isPostgres && columnInfo[0].data_type === "USER-DEFINED" && columnInfo[0].udt_name === "uuid") ||
                           (isPostgres && columnInfo[0].udt_name === "uuid");

        if (isUuidType) {
          console.log(`🔄 Migrating ${fk.table}.${fk.column} from UUID to VARCHAR...`);
          
          // Find and drop foreign key constraints
          if (fk.references) {
            const [refTable, refColumn] = fk.references.split(".");
            const [fkConstraints] = await sequelize.query(`
              SELECT 
                tc.constraint_name,
                tc.table_name
              FROM information_schema.table_constraints AS tc
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
              WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = '${fk.table}'
                AND kcu.column_name = '${fk.column}'
                AND ccu.table_name = '${refTable}'
                AND ccu.column_name = '${refColumn}';
            `);
            
            for (const constraint of fkConstraints) {
              await sequelize.query(`
                ALTER TABLE "${fk.table}" 
                DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";
              `);
              console.log(`  ✅ Dropped constraint ${constraint.constraint_name}`);
            }
          }

          // Convert column type
          await sequelize.query(`
            ALTER TABLE "${fk.table}" 
            ALTER COLUMN "${fk.column}" TYPE VARCHAR(255) 
            USING "${fk.column}"::text;
          `);
          console.log(`  ✅ Converted ${fk.table}.${fk.column} to VARCHAR(255)`);

          // Recreate foreign key if it existed
          if (fk.references) {
            const [refTable, refColumn] = fk.references.split(".");
            const constraintName = `${fk.table}_${fk.column}_fkey`;
            await sequelize.query(`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = '${constraintName}' 
                  AND table_name = '${fk.table}'
                ) THEN
                  ALTER TABLE "${fk.table}" 
                  ADD CONSTRAINT "${constraintName}" 
                  FOREIGN KEY ("${fk.column}") 
                  REFERENCES "${refTable}"("${refColumn}") 
                  ON DELETE CASCADE;
                END IF;
              END $$;
            `);
            console.log(`  ✅ Recreated foreign key constraint`);
          }
        }
      } catch (error) {
        console.error(`  ⚠️  Error migrating ${fk.table}.${fk.column}:`, error.message);
        // Continue with other columns
      }
    }
    
    console.log("✅ Comprehensive UUID/STRING migration check completed!");
  } catch (error) {
    console.error("❌ Comprehensive migration error:", error.message);
    // Don't throw - let server continue
  }
};

// Helper function to migrate Property.propertyId from UUID to STRING
// (Kept for backward compatibility, now calls comprehensive migration)
const migratePropertyIdIfNeeded = async () => {
  try {
    const isPostgres = sequelize.getDialect() === "postgres";
    
    console.log("🔍 Checking Property table schema...");
    
    // Check if Property table exists
    const [results] = await sequelize.query(
      isPostgres
        ? `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'Property'
          ) as exists;`
        : `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'Property'
          ) as exists;`
    );

    const tableExists = isPostgres ? results[0].exists : results[0].exists;

    if (!tableExists) {
      console.log("ℹ️  Property table does not exist. Will be created with correct type.");
      return; // Table doesn't exist, sync will create it with correct type
    }

    // Check current column type - PostgreSQL uses udt_name for custom types like UUID
    const [columnInfo] = await sequelize.query(
      isPostgres
        ? `SELECT data_type, udt_name
           FROM information_schema.columns 
           WHERE table_schema = 'public'
           AND table_name = 'Property' 
           AND column_name = 'propertyId';`
        : `SELECT DATA_TYPE 
           FROM information_schema.columns 
           WHERE table_name = 'Property' 
           AND column_name = 'propertyId';`
    );

    if (columnInfo.length === 0) {
      console.log("ℹ️  propertyId column does not exist. Will be created with correct type.");
      return; // Column doesn't exist
    }

    // For PostgreSQL, udt_name is the key field for UUID types
    // data_type will be 'USER-DEFINED' for UUID, but udt_name will be 'uuid'
    const currentType = isPostgres
      ? (columnInfo[0].udt_name || columnInfo[0].data_type)
      : columnInfo[0].DATA_TYPE;

    console.log(`📊 Current propertyId type: ${currentType} (data_type: ${columnInfo[0].data_type || 'N/A'}, udt_name: ${columnInfo[0].udt_name || 'N/A'})`);

    // Check for UUID type - PostgreSQL uses 'uuid' as udt_name
    // Also check data_type for 'USER-DEFINED' which indicates a custom type
    const isUuidType = currentType === "uuid" || 
                       (isPostgres && columnInfo[0].data_type === "USER-DEFINED" && columnInfo[0].udt_name === "uuid") ||
                       (isPostgres && columnInfo[0].udt_name === "uuid");

    if (isUuidType) {
      console.log("🔄 Migrating Property.propertyId from UUID to VARCHAR...");
      
      // Check if table has data
      const [rowCount] = await sequelize.query(
        isPostgres
          ? `SELECT COUNT(*)::int as count FROM "Property";`
          : `SELECT COUNT(*) as count FROM Property;`
      );
      const count = parseInt(isPostgres ? rowCount[0].count : rowCount[0].count);

      console.log(`📊 Property table has ${count} rows`);

      if (count > 0) {
        console.log(`⚠️  Converting ${count} existing UUIDs to strings...`);
        // Convert existing UUIDs to string format
        if (isPostgres) {
          // First, drop any foreign key constraints that reference propertyId
          try {
            // Find all foreign keys that reference Property.propertyId
            const [fkConstraints] = await sequelize.query(`
              SELECT 
                tc.constraint_name,
                tc.table_name
              FROM information_schema.table_constraints AS tc
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
              WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
                AND ccu.table_name = 'Property'
                AND ccu.column_name = 'propertyId';
            `);
            
            console.log(`📋 Found ${fkConstraints.length} foreign key constraint(s) to drop`);
            
            for (const fk of fkConstraints) {
              try {
                await sequelize.query(`
                  ALTER TABLE "${fk.table_name}" 
                  DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";
                `);
                console.log(`✅ Dropped constraint ${fk.constraint_name} from ${fk.table_name}`);
              } catch (dropError) {
                console.log(`⚠️  Error dropping constraint ${fk.constraint_name}:`, dropError.message);
              }
            }
          } catch (fkError) {
            console.log("⚠️  Error finding foreign key constraints:", fkError.message);
          }

          // Now alter the column type
          console.log("🔄 Altering Property.propertyId column type...");
          await sequelize.query(`
            ALTER TABLE "Property" 
            ALTER COLUMN "propertyId" TYPE VARCHAR(255) 
            USING "propertyId"::text;
          `);
          console.log("✅ Column type changed to VARCHAR(255)");
          
          // Recreate foreign key constraints if they were dropped
          // Case table has foreign key to Property
          try {
            await sequelize.query(`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'Case_propertyId_fkey' 
                  AND table_name = 'Case'
                ) THEN
                  ALTER TABLE "Case" 
                  ADD CONSTRAINT "Case_propertyId_fkey" 
                  FOREIGN KEY ("propertyId") 
                  REFERENCES "Property"("propertyId") 
                  ON DELETE CASCADE;
                END IF;
              END $$;
            `);
            console.log("✅ Recreated foreign key constraints");
          } catch (fkError) {
            console.log("ℹ️  Foreign key constraint may already exist or error:", fkError.message);
          }
        } else {
          await sequelize.query(`
            ALTER TABLE Property 
            MODIFY COLUMN propertyId VARCHAR(255) NOT NULL;
          `);
        }
      } else {
        // No data, safe to alter
        console.log("ℹ️  No existing data, converting column type...");
        if (isPostgres) {
          await sequelize.query(`
            ALTER TABLE "Property" 
            ALTER COLUMN "propertyId" TYPE VARCHAR(255);
          `);
        } else {
          await sequelize.query(`
            ALTER TABLE Property 
            MODIFY COLUMN propertyId VARCHAR(255) NOT NULL;
          `);
        }
        console.log("✅ Column type changed to VARCHAR(255)");
      }
      console.log("✅ Property.propertyId migration completed successfully!");
    } else {
      console.log(`ℹ️  propertyId is already ${currentType}. No migration needed.`);
    }

    // Also migrate Case.propertyId from UUID to VARCHAR if needed
    console.log("🔍 Checking Case.propertyId column type...");
    const [caseColumnInfo] = await sequelize.query(
      isPostgres
        ? `SELECT data_type, udt_name
           FROM information_schema.columns 
           WHERE table_schema = 'public'
           AND table_name = 'Case' 
           AND column_name = 'propertyId';`
        : `SELECT DATA_TYPE 
           FROM information_schema.columns 
           WHERE table_name = 'Case' 
           AND column_name = 'propertyId';`
    );

    if (caseColumnInfo.length > 0) {
      const caseCurrentType = isPostgres
        ? (caseColumnInfo[0].udt_name || caseColumnInfo[0].data_type)
        : caseColumnInfo[0].DATA_TYPE;

      console.log(`📊 Current Case.propertyId type: ${caseCurrentType}`);

      const isCaseUuidType = caseCurrentType === "uuid" || 
                             (isPostgres && caseColumnInfo[0].data_type === "USER-DEFINED" && caseColumnInfo[0].udt_name === "uuid") ||
                             (isPostgres && caseColumnInfo[0].udt_name === "uuid");

      if (isCaseUuidType) {
        console.log("🔄 Migrating Case.propertyId from UUID to VARCHAR...");
        
        // Drop foreign key constraint first
        await sequelize.query(`
          ALTER TABLE "Case" DROP CONSTRAINT IF EXISTS "Case_propertyId_fkey";
        `);
        console.log("✅ Dropped Case.propertyId foreign key constraint");

        // Convert column type
        await sequelize.query(`
          ALTER TABLE "Case" 
          ALTER COLUMN "propertyId" TYPE VARCHAR(255) 
          USING "propertyId"::text;
        `);
        console.log("✅ Case.propertyId column type converted to VARCHAR(255)");

        // Recreate foreign key constraint
        await sequelize.query(`
          ALTER TABLE "Case" 
          ADD CONSTRAINT "Case_propertyId_fkey" 
          FOREIGN KEY ("propertyId") 
          REFERENCES "Property"("propertyId") 
          ON DELETE CASCADE;
        `);
        console.log("✅ Case.propertyId foreign key constraint recreated");
        console.log("✅ Case.propertyId migration completed successfully!");
      } else {
        console.log(`ℹ️  Case.propertyId is already ${caseCurrentType}. No migration needed.`);
      }
    }
  } catch (error) {
    // Log full error but don't throw - migration failure shouldn't stop server
    console.error("❌ Property migration error:", error.message);
    console.error("Error details:", {
      name: error.name,
      code: error.code,
      sql: error.sql,
    });
    if (error.original) {
      console.error("Original error:", error.original.message);
    }
    // Don't throw - let server continue
  }
};

const syncDatabase = async (force = false) => {
  try {
    if (force) {
      console.log("⚠️ Dropping all tables...");
      await sequelize.getQueryInterface().dropAllTables();
      console.log("✅ All tables dropped successfully.");
    }
    await sequelize.sync({ alter: true, force });
    
    // Run comprehensive UUID/STRING migration check
    await migrateAllUuidMismatches();
  } catch (err) {
    throw err;
  }
};

// Export migration functions for use in server.js
module.exports.migratePropertyIdIfNeeded = migratePropertyIdIfNeeded;
module.exports.migrateAllUuidMismatches = migrateAllUuidMismatches;

User.hasMany(Case, { foreignKey: "userId" });
User.hasMany(Case, { foreignKey: "inspectorId", as: "inspectedCases" });
User.hasMany(Report, { foreignKey: "userId", as: "inspectorReports" });
User.hasMany(Availability, {
  foreignKey: "userId",
  as: "inspectorAvailability",
});
User.hasMany(InspectorPayment, {
  foreignKey: "userId",
  as: "inspectorPayments",
});
User.hasMany(TrackingTime, {
  foreignKey: "inspectorId",
  as: "inspectorTrackingTime",
});
User.hasOne(BankDetails, {
  foreignKey: "userId",
  as: "bankDetails",
  onDelete: "CASCADE",
});
User.hasOne(NotificationSettings, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: "CASCADE",
});
User.hasOne(PrivacyPolicySettings, {
  foreignKey: "userId",
  as: "privacyPolicy",
  onDelete: "CASCADE",
});
User.belongsToMany(Expertise, {
  through: UserExpertise,
  foreignKey: "userId",
  otherKey: "expertiseCode",
  as: "expertises",
});

Expertise.belongsToMany(User, {
  through: UserExpertise,
  foreignKey: "expertiseCode",
  otherKey: "userId",
  as: "inspectors",
});

Conversation.belongsTo(User, { foreignKey: "userOne", as: "UserOneDetails" });
Conversation.belongsTo(User, { foreignKey: "userTwo", as: "UserTwoDetails" });

Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
  as: "conversation",
});
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

Case.belongsTo(User, { foreignKey: "userId", as: "tenant" });
Case.belongsTo(User, {
  foreignKey: "inspectorId",
  as: "inspector",
  allowNull: true,
});
Case.belongsTo(Property, { foreignKey: "propertyId", as: "property" });
Case.hasMany(Damage, {
  foreignKey: "caseId",
  as: "damages",
  onDelete: "CASCADE",
});
Case.hasMany(Report, {
  foreignKey: "caseId",
  as: "reports",
  onDelete: "CASCADE",
});
Case.hasMany(Payment, { foreignKey: "caseId", as: "payments", onDelete: "CASCADE" });
Case.hasMany(CaseTimeline, {
  foreignKey: "caseId",
  as: "timeline",
  onDelete: "CASCADE",
});
Case.hasOne(Refund, {
  foreignKey: "caseId",
  as: "refund",
  onDelete: "CASCADE",
});

CaseTimeline.belongsTo(Case, { foreignKey: "caseId", onDelete: "CASCADE" });

Report.belongsTo(Case, { foreignKey: "caseId", onDelete: "CASCADE" });
Report.belongsTo(User, { foreignKey: "inspectorId", as: "inspector" });
Report.hasMany(AssessmentItem, { foreignKey: "reportId", as: "assessmentItems" });
Report.hasOne(AssessmentSummary, { foreignKey: "reportId", as: "assessmentSummary" });


Availability.belongsTo(User, { foreignKey: "userId", as: "inspector" });

BankDetails.belongsTo(User, { foreignKey: "userId", as: "inspector" });

Damage.belongsTo(Case, { foreignKey: "caseId", onDelete: "CASCADE" });
Damage.hasMany(DamagePhoto, { foreignKey: "damageId", as: "damagePhotos" });

Report.hasMany(ReportPhoto, {
  foreignKey: "reportId",
  as: "reportPhotos",
});

InspectorPayment.belongsTo(User, {
  foreignKey: "inspectorId",
  as: "inspector",
});
InspectorPayment.belongsTo(BankDetails, {
  foreignKey: "inspectorId",
  targetKey: "userId",
  as: "bankDetails",
});
InspectorPayment.belongsTo(Case, {
  foreignKey: "caseId",
  as: "case",
  allowNull: true,
});

Payment.belongsTo(Case, { foreignKey: "caseId", onDelete: "CASCADE" });

Property.hasMany(Case, { foreignKey: "propertyId", as: "cases" });

Refund.belongsTo(Case, {
  foreignKey: "caseId",
  as: "caseDetails",
  onDelete: "CASCADE",
});

TrackingTime.belongsTo(User, { foreignKey: "inspectorId", as: "inspector" });
TrackingTime.belongsTo(Case, { foreignKey: "caseId", as: "case" });

NotificationSettings.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
});

PrivacyPolicySettings.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
});

module.exports = {
  sequelize,
  syncDatabase,
  migratePropertyIdIfNeeded,
  migrateAllUuidMismatches,
  User,
  Case,
  CaseTimeline,
  Damage,
  Payment,
  Report,
  Availability,
  BankDetails,
  Expertise,
  InspectorPayment,
  Property,
  Refund,
  TrackingTime,
  Otp,
  DamagePhoto,
  NotificationSettings,
  PrivacyPolicySettings,
  PlatformSettings,
  Message,
  Conversation,
  UserExpertise,
  AssessmentItem,
  AssessmentSummary,
  ActionLog,
};
