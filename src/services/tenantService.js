const {
  User,
  Payment,
  Case,
  Damage,
  DamagePhoto,
  Property,
  PrivacyPolicySettings,
} = require("../models/index");
const { Sequelize, Op } = require("sequelize");

const getTenantById = async (tenantId) => {
  return await User.findOne({
    where: { userId: tenantId, userType: "tenant" },
    attributes: [
      ["userId", "tenantId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userPhone", "phone"],
      ["userCity", "city"],
      ["userAddress", "address"],
      ["userPostcode", "postcode"],
      ["userCountry", "country"],
      ["createdAt", "dateRegistered"],
      [
        Sequelize.literal(`(
          SELECT COUNT(*) FROM "Case"
          WHERE "Case"."userId" = "User"."userId"
        )`),
        "casesSubmitted",
      ],
    ],
  });
};

const getAllTenants = async ({ search, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const whereClause = { userType: "tenant" };

  if (search) {
    whereClause[Op.or] = [
      { userFirstName: { [Op.like]: `%${search}%` } },
      { userLastName: { [Op.like]: `%${search}%` } },
      { userEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows: tenants, count: totalTenants } = await User.findAndCountAll({
    where: whereClause,
    attributes: [
      ["userId", "tenantId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userPhone", "phone"],
      ["userCountry", "country"],
      ["userStatus", "status"],
      ["createdAt", "dateRegistered"],
      [
        Sequelize.literal(`(
          SELECT COUNT(*) FROM "Case"
          WHERE "Case"."userId" = "User"."userId"
        )`),
        "casesSubmitted",
      ],
    ],
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    tenants,
    totalTenants,
    totalPages: Math.ceil(totalTenants / limit),
    currentPage: parseInt(page),
  };
};

const exportTenants = async () => {
  return await User.findAll({
    where: { userType: "tenant" },
    attributes: [
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userPhone", "phone"],
      ["userCity", "city"],
      ["userAddress", "address"],
      ["userPostcode", "postcode"],
      ["userCountry", "country"],
    ],
    order: [["createdAt", "DESC"]],
    raw: true,
  });
};

const getTenantTransactions = async ({
  tenantId,
  search,
  status,
  startDate,
  endDate,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (status) {
    whereClause.paymentStatus = status;
  }

  if (startDate && endDate) {
    whereClause.paymentDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else if (startDate) {
    whereClause.paymentDate = {
      [Op.gte]: new Date(startDate),
    };
  } else if (endDate) {
    whereClause.paymentDate = {
      [Op.lte]: new Date(endDate),
    };
  }

  const inspectorWhereClause = {};
  if (search) {
    inspectorWhereClause[Op.or] = [
      {
        $userFirstName$: { [Op.like]: `%${search}%` },
      },
      {
        $userLastName$: { [Op.like]: `%${search}%` },
      },
    ];
  }
  const { rows: transactions, count: totalTransactions } =
    await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Case,
          where: { userId: tenantId },
          attributes: ["caseId"],
          include: [
            {
              model: User,
              as: "inspector",
              where: inspectorWhereClause,
              attributes: [
                [
                  Sequelize.fn(
                    "CONCAT",
                    Sequelize.col("userFirstName"),
                    " ",
                    Sequelize.col("userLastName")
                  ),
                  "inspectorName",
                ],
              ],
            },
          ],
        },
      ],
      attributes: [
        ["paymentAmount", "amount"],
        ["paymentDate", "date"],
        ["paymentStatus", "status"],
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
    });

  return {
    transactions,
    totalTransactions,
    totalPages: Math.ceil(totalTransactions / limit),
    currentPage: parseInt(page),
  };
};

const deactivateTenant = async (tenantId) => {
  const tenant = await User.findOne({
    where: { userId: tenantId, userType: "tenant" },
  });

  if (!tenant) return null;

  await tenant.update({ userStatus: "inactive" });
  return tenant;
};

const getTenantDashboard = async (tenantId) => {
  const tenant = await User.findOne({
    where: { userId: tenantId, userType: "tenant" },
    attributes: ["userFirstName", "userLastName"],
  });

  // Use raw queries with text casting to handle invalid enum values gracefully
  const isPostgres = Case.sequelize.getDialect() === "postgres";
  
  try {
    // Active cases count - using raw query to handle enum issues
    const activeCasesCount = isPostgres
      ? await Case.sequelize.query(
          `SELECT COUNT(*) as count FROM "Case" 
           WHERE "userId" = :userId 
           AND "caseStatus"::text = 'open'`,
          {
            replacements: { userId: tenantId },
            type: Case.sequelize.QueryTypes.SELECT,
          }
        ).then((result) => parseInt(result[0]?.count || 0))
      : await Case.count({
          where: {
            userId: tenantId,
            caseStatus: { [Op.in]: ["open"] },
          },
        });

    // Requires attention count
    const requiresAttentionCount = isPostgres
      ? await Case.sequelize.query(
          `SELECT COUNT(*) as count FROM "Case" 
           WHERE "userId" = :userId 
           AND "caseStatus"::text = 'open'
           AND "caseUrgencyLevel" = 'high'`,
          {
            replacements: { userId: tenantId },
            type: Case.sequelize.QueryTypes.SELECT,
          }
        ).then((result) => parseInt(result[0]?.count || 0))
      : await Case.count({
          where: {
            userId: tenantId,
            caseStatus: { [Op.in]: ["open"] },
            caseUrgencyLevel: "high",
          },
        });

    // Resolved cases count
    const resolvedCasesCount = isPostgres
      ? await Case.sequelize.query(
          `SELECT COUNT(*) as count FROM "Case" 
           WHERE "userId" = :userId 
           AND "caseStatus"::text = 'completed'`,
          {
            replacements: { userId: tenantId },
            type: Case.sequelize.QueryTypes.SELECT,
          }
        ).then((result) => parseInt(result[0]?.count || 0))
      : await Case.count({
          where: {
            userId: tenantId,
            caseStatus: "completed",
          },
        });

    // Scheduled inspections count
    const scheduledInspectionsCount = isPostgres
      ? await Case.sequelize.query(
          `SELECT COUNT(*) as count FROM "Case" 
           WHERE "userId" = :userId 
           AND "caseStatus"::text IN ('open', 'in-progress')
           AND ("caseDeadline" IS NOT NULL OR "inspectorId" IS NOT NULL)`,
          {
            replacements: { userId: tenantId },
            type: Case.sequelize.QueryTypes.SELECT,
          }
        ).then((result) => parseInt(result[0]?.count || 0))
      : await Case.count({
          where: {
            userId: tenantId,
            caseStatus: { [Op.in]: ["open", "in-progress"] },
            [Op.or]: [
              { caseDeadline: { [Op.ne]: null } },
              { inspectorId: { [Op.ne]: null } }
            ],
          },
        });

    // Next inspection case
    const nextInspectionResult = isPostgres
      ? await Case.sequelize.query(
          `SELECT "caseId", "caseDeadline" FROM "Case" 
           WHERE "userId" = :userId 
           AND "caseStatus"::text IN ('open', 'in-progress')
           AND "caseDeadline" >= :now
           ORDER BY "caseDeadline" ASC
           LIMIT 1`,
          {
            replacements: { userId: tenantId, now: new Date() },
            type: Case.sequelize.QueryTypes.SELECT,
          }
        )
      : await Case.findOne({
          where: {
            userId: tenantId,
            caseStatus: { [Op.in]: ["open", "in-progress"] },
            caseDeadline: { [Op.gte]: new Date() },
          },
          attributes: ["caseId", "caseDeadline"],
          order: [["caseDeadline", "ASC"]],
        });
    
    const nextInspectionCase = isPostgres ? (nextInspectionResult[0] || null) : nextInspectionResult;

    // Format next inspection date
    let nextInspection = "No upcoming inspections";
    if (nextInspectionCase && nextInspectionCase.caseDeadline) {
      const inspectionDate = new Date(nextInspectionCase.caseDeadline);
      const now = new Date();
      const diff = inspectionDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        nextInspection = "Today";
      } else if (days === 1) {
        nextInspection = "Tomorrow";
      } else if (days < 7) {
        nextInspection = `In ${days} days`;
      } else {
        nextInspection = inspectionDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    // Get cases with deadlines for time remaining calculation
    const casesWithDeadlinesResult = isPostgres
      ? await Case.sequelize.query(
          `SELECT "caseId", "caseDeadline" FROM "Case" 
           WHERE "userId" = :userId 
           AND "caseStatus"::text IN ('open', 'on-hold', 'in-progress')
           AND "caseDeadline" IS NOT NULL
           LIMIT 10`,
          {
            replacements: { userId: tenantId },
            type: Case.sequelize.QueryTypes.SELECT,
          }
        )
      : await Case.findAll({
          where: {
            userId: tenantId,
            caseStatus: { [Op.in]: ["open", "on-hold", "in-progress"] },
            caseDeadline: { [Op.ne]: null },
          },
          attributes: ["caseId", "caseDeadline"],
          limit: 10,
        });
    
    const casesWithDeadlines = isPostgres ? casesWithDeadlinesResult : casesWithDeadlinesResult;

    // Helper function to calculate time remaining
    const calculateTimeRemaining = (deadline) => {
      if (!deadline) return null;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      
      if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return { expired: false, days, hours, minutes };
    };

    const casesWithTimeRemaining = casesWithDeadlines.map((caseItem) => ({
      caseId: caseItem.caseId,
      timeRemaining: calculateTimeRemaining(caseItem.caseDeadline),
    }));

    return {
      welcomeMessage: `Welcome back ${tenant?.userFirstName || "User"} 👋`,
      activeCases: {
        count: activeCasesCount,
        requiresAttention: requiresAttentionCount,
      },
      resolvedIssues: {
        count: resolvedCasesCount,
        // last30Days: true,
      },
      scheduledInspections: scheduledInspectionsCount,
      nextInspection: nextInspection,
      casesWithTimeRemaining: casesWithTimeRemaining,
    };
  } catch (error) {
    // Handle enum errors gracefully
    if (error.message && error.message.includes('enum') && error.message.includes('pending')) {
      console.error("⚠️  Database enum error detected. Cases with 'pending' status exist but enum doesn't support it.");
      console.error("🔧 Attempting to auto-fix the enum...");
      
      try {
        // Try to fix the enum automatically
        const fixCaseStatusEnum = require("../utils/fixCaseStatusEnum");
        const fixResult = await fixCaseStatusEnum();
        
        if (fixResult.success) {
          console.log("✅ Enum fixed successfully, retrying dashboard query...");
          // Retry the dashboard query after fixing
          return await getTenantDashboard(tenantId);
        } else {
          console.error("❌ Failed to auto-fix enum:", fixResult.message);
        }
      } catch (fixError) {
        console.error("❌ Error during auto-fix:", fixError.message);
      }
      
      console.error("💡 Manual fix: Call POST /admins/fix-case-status-enum or run migration");
      
      // Return safe defaults
      return {
        welcomeMessage: `Welcome back ${tenant?.userFirstName || "User"} 👋`,
        activeCases: {
          count: 0,
          requiresAttention: 0,
        },
        resolvedIssues: {
          count: 0,
        },
        scheduledInspections: 0,
        nextInspection: "No upcoming inspections",
        casesWithTimeRemaining: [],
      };
    }
    throw error;
  }
};

const getTenantCases = async (
  userId,
  { search, status, urgency, page, limit }
) => {
  const offset = (page - 1) * limit;
  const whereClause = { userId };

  if (status) {
    whereClause.caseStatus = status;
  }

  if (urgency) {
    whereClause.caseUrgencyLevel = urgency;
  }

  if (search) {
    whereClause[Op.or] = [
      { caseDescription: { [Op.like]: `%${search}%` } },
      { "$property.propertyAddress$": { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows: cases, count: totalCases } = await Case.findAndCountAll({
    where: whereClause,
    attributes: [
      "buildingNumber",
      ["caseId", "caseID"],
      ["caseDescription", "caseTitle"],
      ["caseStatus", "status"],
      ["caseUrgencyLevel", "urgency"],
      ["createdAt", "reportedDate"],
      [
        Sequelize.literal(`(
          SELECT COUNT(DISTINCT "damages"."damageId")
          FROM "Damage" AS "damages"
          WHERE "damages"."caseId" = "Case"."caseId"
        )`),
        "numDamages",
      ],
      [
        Sequelize.literal(`(
          SELECT COUNT("damagePhotos"."photoId")
          FROM "Damage" AS "damages"
          LEFT OUTER JOIN "DamagePhoto" AS "damagePhotos" ON "damages"."damageId" = "damagePhotos"."damageId"
          WHERE "damages"."caseId" = "Case"."caseId"
        )`),
        "numPhotos",
      ],
      [
        Sequelize.literal(`(
          SELECT "damagePhotos"."photoUrl"
          FROM "Damage" AS "damages"
          LEFT OUTER JOIN "DamagePhoto" AS "damagePhotos" ON "damages"."damageId" = "damagePhotos"."damageId"
          WHERE "damages"."caseId" = "Case"."caseId"
          AND "damagePhotos"."photoUrl" IS NOT NULL
          ORDER BY "damagePhotos"."createdAt" ASC
          LIMIT 1
        )`),
        "firstPhotoUrl",
      ],
    ],
    include: [
      {
        model: Property,
        as: "property",
        attributes: ["propertyId", "propertyAddress"],
        required: false,
      },
      {
        model: Damage,
        as: "damages",
        attributes: ["damageId", "damageLocation"],
        include: [
        {
          model: DamagePhoto,
          as: "damagePhotos",
          attributes: ["photoId", "photoUrl", "photoType"],
          required: false,
          limit: 1,
          order: [["createdAt", "ASC"]],
        },
        ],
        required: false,
        separate: true, // Load damages separately to avoid GROUP BY issues
      },
    ],
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
    distinct: true, // Important for PostgreSQL when using includes with count
  });

  return {
    cases,
    totalCases,
    totalPages: Math.ceil(totalCases / limit),
    currentPage: parseInt(page),
  };
};

const getTenantSettings = async (tenantId) => {
  const tenant = await User.findOne({
    where: { userId: tenantId },
    attributes: [
      "userFirstName",
      "userLastName",
      "userEmail",
      "userPhone",
      "userProfilePic",
    ],
    include: [
      {
        model: PrivacyPolicySettings,
        as: "privacyPolicy",
        attributes: ["essentialCookies", "thirdPartySharing"],
      },
    ],
  });

  if (!tenant) return null;

  return {
    account: {
      userFirstName: tenant.userFirstName,
      userLastName: tenant.userLastName,
      userEmail: tenant.userEmail,
      userPhone: tenant.userPhone,
      userProfilePic: tenant.userProfilePic,
    },
    privacySecurity: tenant.privacyPolicy,
  };
};

const updateTenantSettings = async (tenantId, data) => {
  const { privacyPolicy } = data;

  const tenant = await User.findOne({
    where: { userId: tenantId },
  });

  if (!tenant) {
    return { success: false, message: "Tenant not found" };
  }

  if (privacyPolicy) {
    await PrivacyPolicySettings.update(
      { ...privacyPolicy },
      { where: { userId: tenantId } }
    );
    return {
      success: true,
      message: "Tenant settings updated successfully",
    };
  }

  return { success: false, message: "No setting updated" };
};

module.exports = {
  getAllTenants,
  getTenantTransactions,
  getTenantById,
  deactivateTenant,
  exportTenants,
  getTenantDashboard,
  getTenantCases,
  getTenantSettings,
  updateTenantSettings,
};
