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

// Helper function to migrate Property.propertyId from UUID to STRING
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

    // Check current column type
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

    const currentType = isPostgres
      ? (columnInfo[0].udt_name || columnInfo[0].data_type)
      : columnInfo[0].DATA_TYPE;

    console.log(`📊 Current propertyId type: ${currentType}`);

    // Check for UUID type (PostgreSQL uses 'uuid' as udt_name, MySQL uses 'char')
    if (currentType === "uuid" || (currentType === "character" && isPostgres)) {
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
            await sequelize.query(`
              DO $$ 
              DECLARE 
                r RECORD;
              BEGIN
                FOR r IN (SELECT constraint_name, table_name 
                          FROM information_schema.table_constraints 
                          WHERE constraint_type = 'FOREIGN KEY' 
                          AND constraint_schema = 'public'
                          AND constraint_name LIKE '%propertyId%') 
                LOOP
                  EXECUTE 'ALTER TABLE "' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
                END LOOP;
              END $$;
            `);
            console.log("✅ Dropped foreign key constraints");
          } catch (fkError) {
            console.log("ℹ️  No foreign key constraints to drop or error:", fkError.message);
          }

          // Now alter the column type
          await sequelize.query(`
            ALTER TABLE "Property" 
            ALTER COLUMN "propertyId" TYPE VARCHAR(255) 
            USING "propertyId"::text;
          `);
          console.log("✅ Column type changed to VARCHAR(255)");
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
    
    // Run Property migration if needed (one-time fix for UUID to STRING)
    await migratePropertyIdIfNeeded();
  } catch (err) {
    throw err;
  }
};

// Export migration function for use in server.js
module.exports.migratePropertyIdIfNeeded = migratePropertyIdIfNeeded;

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
  foreignKey: "userId",
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
Case.hasMany(Payment, { foreignKey: "caseId", onDelete: "CASCADE" });
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

Payment.belongsTo(Case, { foreignKey: "caseId", onDelete: "CASCADE" });

Property.hasMany(Case, { foreignKey: "propertyId", as: "cases" });

Refund.belongsTo(Case, {
  foreignKey: "caseId",
  as: "caseDetails",
  onDelete: "CASCADE",
});

TrackingTime.belongsTo(User, { foreignKey: "userId", as: "inspector" });

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
};
