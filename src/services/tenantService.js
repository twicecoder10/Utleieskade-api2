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
          SELECT COUNT(*) FROM \`Case\`
          WHERE \`Case\`.\`userId\` = \`User\`.\`userId\`
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
      ["createdAt", "dateRegistered"],
      [
        Sequelize.literal(`(
          SELECT COUNT(*) FROM \`Case\`
          WHERE \`Case\`.\`userId\` = \`User\`.\`userId\`
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

  const activeCasesCount = await Case.count({
    where: {
      userId: tenantId,
      caseStatus: { [Op.in]: ["open"] },
    },
  });

  const requiresAttentionCount = await Case.count({
    where: {
      userId: tenantId,
      caseStatus: { [Op.in]: ["open"] },
      caseUrgencyLevel: "high",
    },
  });

  const resolvedCasesCount = await Case.count({
    where: {
      userId: tenantId,
      caseStatus: "completed",
      // caseCompletedDate: {
      //   [Op.gte]: Sequelize.literal("DATE_SUB(NOW(), INTERVAL 30 DAY)"),
      // },
    },
  });

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
  };
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
    ],
    include: [
      {
        model: Property,
        as: "property",
        attributes: ["propertyAddress"],
      },
      {
        model: Damage,
        as: "damages",
        attributes: [
          [
            Sequelize.fn("COUNT", Sequelize.col("damages.damageId")),
            "numPhotos",
          ],
          "damageLocation",
        ],
        include: [
          {
            model: DamagePhoto,
            as: "damagePhotos",
            attributes: [],
          },
        ],
      },
    ],
    group: ["Case.caseId"],
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
    subQuery: false,
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
