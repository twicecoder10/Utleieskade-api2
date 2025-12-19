const {
  User,
  Case,
  InspectorPayment,
  BankDetails,
  NotificationSettings,
  PrivacyPolicySettings,
  Expertise,
  UserExpertise,
} = require("../models/index");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const createInspector = async (inspectorData, inspectorExpertiseCodes) => {
  const newInspector = await User.create(inspectorData);
  if (inspectorExpertiseCodes && inspectorExpertiseCodes.length > 0) {
    const expertiseEntries = inspectorExpertiseCodes.map((code) => ({
      userId: newInspector.userId,
      expertiseCode: code,
    }));

    await UserExpertise.bulkCreate(expertiseEntries, {
      ignoreDuplicates: true,
    });
  }
  return newInspector;
};

const getInspectorDasboard = async (inspectorId) => {
  try {
    if (!inspectorId) {
      throw new Error("Inspector ID is required");
    }

    const inspector = await User.findOne({
      where: { userId: inspectorId, userType: "inspector" },
      attributes: ["userFirstName", "userLastName"],
    });

    if (!inspector) {
      throw new Error("Inspector not found");
    }

    const activeCases = await Case.count({
      where: {
        inspectorId,
        caseStatus: "open",
      },
    }) || 0;

    let totalEarnings = 0;
    try {
      const earningsSum = await InspectorPayment.sum("paymentAmount", {
        where: { inspectorId },
      });
      totalEarnings = earningsSum ? parseFloat(earningsSum) : 0;
    } catch (earningsError) {
      console.error("Error calculating total earnings:", earningsError);
      // If InspectorPayment model doesn't exist or has issues, default to 0
      totalEarnings = 0;
    }

    // Get prioritized cases (open cases with deadlines)
    const prioritizedCasesRaw = await Case.findAll({
      where: {
        inspectorId,
        caseStatus: "open",
      },
      attributes: [
        "caseId",
        "caseDescription",
        "caseStatus",
        "caseDeadline",
        "caseUrgencyLevel",
        "createdAt",
      ],
      include: [
        {
          model: User,
          as: "tenant",
          attributes: [
            ["userId", "tenantId"],
            "userFirstName",
            "userLastName",
          ],
          required: false,
        },
      ],
      order: [["caseDeadline", "ASC NULLS LAST"]],
      limit: 10,
    }) || [];

    // Transform cases to match frontend expectations
    const prioritizedCases = prioritizedCasesRaw.map((caseItem) => {
      const caseData = caseItem.get({ plain: true });
      const tenant = caseData.tenant;
      
      return {
        caseId: caseData.caseId,
        caseDescription: caseData.caseDescription,
        caseStatus: caseData.caseStatus,
        caseDeadline: caseData.caseDeadline,
        caseUrgencyLevel: caseData.caseUrgencyLevel,
        createdAt: caseData.createdAt,
        tenantName: tenant 
          ? `${tenant.userFirstName || ""} ${tenant.userLastName || ""}`.trim()
          : "N/A",
        tenant: tenant || null,
      };
    });

    // Calculate total work hours and minutes from case timers
    // For now, return 0 if timer functionality doesn't exist
    const totalWorkHours = 0;
    const totalWorkMinutes = 0;

    return {
      welcomeMessage: `Welcome back ${inspector?.userFirstName || "User"} 👋`,
      totalEarnings: totalEarnings || 0,
      activeCases: activeCases || 0,
      prioritizedCases: prioritizedCases || [],
      totalWorkHours: totalWorkHours || 0,
      totalWorkMinutes: totalWorkMinutes || 0,
    };
  } catch (error) {
    console.error("Error in getInspectorDasboard:", error);
    throw error;
  }
};

const getInspectorById = async (inspectorId) => {
  return await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
    attributes: {
      exclude: ["userPassword"],
    },
    include: [
      {
        model: Expertise,
        as: "expertises",
        attributes: ["expertiseCode", "expertiseArea", "expertiseDescription"],
        through: { attributes: [] },
      },
    ],
  });
};

const getAllInspectors = async ({ search, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const whereClause = { userType: "inspector" };

  if (search) {
    whereClause[Op.or] = [
      { userFirstName: { [Op.like]: `%${search}%` } },
      { userLastName: { [Op.like]: `%${search}%` } },
      { userEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows: inspectors, count: totalInspectors } =
    await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["userPassword"] },
      include: [
        {
          model: Expertise,
          as: "expertises",
          attributes: ["expertiseCode", "expertiseArea", "expertiseDescription"],
          through: { attributes: [] },
          required: false, // Left join - don't require expertise to exist
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true, // Important for PostgreSQL when using includes with count
    });

  return {
    inspectors,
    totalInspectors,
    totalPages: Math.ceil(totalInspectors / limit),
    currentPage: parseInt(page),
  };
};

const exportInspectors = async () => {
  return await User.findAll({
    where: { userType: "inspector" },
    attributes: [
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userPhone", "phone"],
      ["userCity", "city"],
      ["userAddress", "address"],
      ["userPostcode", "postcode"],
      ["userCountry", "country"],
      ["createdAt", "dateRegistered"],
    ],
    order: [["createdAt", "DESC"]],
    raw: true,
  });
};

const deactivateInspector = async (inspectorId) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
  });

  if (!inspector) return null;

  await inspector.update({ userStatus: "inactive" });
  return inspector;
};

const getInspectorCases = async ({
  search,
  status,
  page,
  limit,
  sortBy,
  sortOrder,
  userId,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = { inspectorId: userId };

  if (status) {
    whereClause.caseStatus = status;
  }

  if (search) {
    whereClause.caseDescription = { [Op.like]: `%${search}%` };
  }

  const { rows: cases, count: totalCases } = await Case.findAndCountAll({
    where: whereClause,
    attributes: [
      ["caseId", "caseID"],
      ["caseDescription", "caseDescription"],
      ["caseStatus", "status"],
    ],
    include: [
      {
        model: User,
        as: "tenant",
        attributes: [
          ["userId", "tenantId"],
          "userFirstName",
          "userLastName",
          "userProfilePic",
        ],
      },
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    cases,
    totalCases,
    totalPages: Math.ceil(totalCases / limit),
    currentPage: parseInt(page),
  };
};

const getInspectorEarnings = async (inspectorId) => {
  try {
    const totalBalance = await InspectorPayment.sum("paymentAmount", {
      where: {
        inspectorId,
        paymentStatus: "pending",
      },
    }) || 0;

    const payoutHistory = await InspectorPayment.findAll({
      where: { inspectorId },
      attributes: [
        ["paymentDate", "date"],
        ["paymentId", "referenceNumber"],
        ["paymentAmount", "amount"],
        ["paymentStatus", "status"],
      ],
      order: [["paymentDate", "DESC"]],
      raw: true,
    }) || [];

    return {
      totalBalance,
      payoutHistory: payoutHistory.map((payment) => ({
        ...payment,
        amount: payment.amount || 0,
        cases: 0, // TODO: Add case count if needed
      })),
    };
  } catch (error) {
    console.error("Error in getInspectorEarnings:", error);
    throw error;
  }
};

const requestPayout = async ({ inspectorId, amount, userPassword }) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
    attributes: ["userPassword"],
  });

  if (!inspector) {
    return {
      success: false,
      message: "Inspector not found",
    };
  }

  const isPasswordValid = await bcrypt.compare(
    userPassword,
    inspector.userPassword
  );
  if (!isPasswordValid) {
    return {
      success: false,
      message: "Incorrect password",
    };
  }

  const pendingBalance = await InspectorPayment.sum("paymentAmount", {
    where: {
      inspectorId,
      paymentStatus: "pending",
    },
  });

  if (!pendingBalance) {
    return {
      success: false,
      message: "You currently have no pending balance",
    };
  }

  if (parseFloat(amount) !== parseFloat(pendingBalance)) {
    return {
      success: false,
      message: `Invalid payout amount requested. You can only request a payout of ${pendingBalance} which is your pending balance.`,
    };
  }

  await InspectorPayment.update(
    { paymentStatus: "requested" },
    {
      where: { inspectorId, paymentStatus: "pending" },
    }
  );

  return {
    success: true,
    message: "Payout request successful. Your payment is being processed.",
  };
};

const getInspectorSettings = async (inspectorId) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId },
    attributes: [
      "userFirstName",
      "userLastName",
      "userEmail",
      "userPhone",
      "userCity",
      "userPostcode",
      "userAddress",
      "userCountry",
      "userProfilePic",
      "userStatus",
    ],
    include: [
      {
        model: BankDetails,
        as: "bankDetails",
        attributes: [
          "bankName",
          "accountNumber",
          "sortCode",
          "userFirstName",
          "userLastName",
        ],
      },
      {
        model: NotificationSettings,
        as: "notifications",
        attributes: [
          "deadlineNotifications",
          "newCaseAlerts",
          "tenantsUpdates",
          "messageNotifications",
        ],
      },
      {
        model: PrivacyPolicySettings,
        as: "privacyPolicy",
        attributes: ["essentialCookies", "thirdPartySharing"],
      },
      {
        model: Expertise,
        as: "expertises",
        attributes: ["expertiseCode", "expertiseArea", "expertiseDescription"],
        through: { attributes: [] },
      },
    ],
  });

  if (!inspector) return null;

  return {
    account: {
      userFirstName: inspector.userFirstName,
      userLastName: inspector.userLastName,
      userEmail: inspector.userEmail,
      userPhone: inspector.userPhone,
      expertiseCode: inspector.expertiseCode,
      language: "English",
      userAddress: inspector.userAddress,
      userPostcode: inspector.userPostcode,
      userCountry: inspector.userCountry,
      userProfilePic: inspector.userProfilePic,
      expertises: inspector.expertises.map((expertise) => ({
        expertiseCode: expertise.expertiseCode,
        expertiseArea: expertise.expertiseArea,
        expertiseDescription: expertise.expertiseDescription,
      })),
    },
    notifications: inspector.notifications,
    payment: inspector.bankDetails,
    privacySecurity: {
      mfaEnabled: false,
      pauseMode: inspector.userStatus === "active" ? false : true,
    },
  };
};

const updateInspectorSettings = async (inspectorId, data) => {
  const { notifications, payment, privacySecurity, expertises } = data;

  const inspector = await User.findOne({
    where: { userId: inspectorId },
    include: [{ model: Expertise, as: "expertises" }],
  });

  if (!inspector) {
    return { success: false, message: "Inspector not found" };
  }

  if (notifications) {
    await NotificationSettings.update(
      { ...notifications },
      { where: { userId: inspectorId } }
    );
  }

  if (payment) {
    await BankDetails.update(
      {
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        userFirstName: payment.userFirstName,
        userLastName: payment.userLastName,
      },
      { where: { userId: inspectorId } }
    );
  }

  if (privacySecurity && privacySecurity.pauseMode) {
    inspector.userStatus = "inactive";
    await inspector.save();
  }

  if (expertises) {
    const existingExpertises = inspector.expertises.map((e) => e.expertiseCode);

    const codesToAdd = expertises.filter(
      (code) => !existingExpertises.includes(code)
    );
    const codesToRemove = existingExpertises.filter(
      (code) => !expertises.includes(code)
    );

    if (codesToRemove.length > 0) {
      await UserExpertise.destroy({
        where: {
          userId: inspectorId,
          expertiseCode: codesToRemove,
        },
      });
    }

    if (codesToAdd.length > 0) {
      const newExpertiseMappings = codesToAdd.map((code) => ({
        userId: inspectorId,
        expertiseCode: code,
      }));
      await UserExpertise.bulkCreate(newExpertiseMappings);
    }
  }

  return { success: true, message: "Inspector settings updated successfully" };
};

const deleteInspector = async (inspectorId) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
  });
  if (!inspector) return null;

  await inspector.destroy();
  return inspector;
};

const getInspectorReports = async ({ inspectorId, page, limit, search }) => {
  const { Report, Case, AssessmentSummary } = require("../models/index");
  const offset = (page - 1) * limit;
  const whereClause = { inspectorId };

  if (search) {
    whereClause.reportDescription = { [Op.like]: `%${search}%` };
  }

  const { rows: reports, count: totalReports } = await Report.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Case,
        attributes: [
          ["caseId", "caseID"],
          ["caseDescription", "caseDescription"],
        ],
      },
      {
        model: AssessmentSummary,
        as: "assessmentSummary",
        attributes: [
          ["sumInclVAT", "total"],
        ],
        required: false,
      },
    ],
    attributes: [
      ["reportId", "reportId"],
      ["caseId", "caseId"],
      ["reportDescription", "description"],
      ["createdAt", "date"],
    ],
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    reports,
    totalReports,
    totalPages: Math.ceil(totalReports / limit),
    currentPage: parseInt(page),
  };
};

module.exports = {
  getInspectorById,
  getAllInspectors,
  createInspector,
  exportInspectors,
  deactivateInspector,
  getInspectorDasboard,
  getInspectorCases,
  getInspectorEarnings,
  requestPayout,
  getInspectorSettings,
  updateInspectorSettings,
  deleteInspector,
  getInspectorReports,
};
