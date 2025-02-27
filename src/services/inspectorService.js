const {
  User,
  Case,
  InspectorPayment,
  BankDetails,
  NotificationSettings,
  PrivacyPolicySettings,
} = require("../models/index");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const createInspector = async (inspectorData) => {
  return await User.create(inspectorData);
};

const getInspectorDasboard = async (inspectorId) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
    attributes: ["userFirstName", "userLastName"],
  });

  const activeCases = await Case.count({
    where: {
      inspectorId,
      caseStatus: "open",
    },
  });

  const totalEarnings = await InspectorPayment.sum("paymentAmount", {
    where: { inspectorId },
  });

  return {
    welcomeMessage: `Welcome back ${inspector?.userFirstName || "User"} 👋`,
    totalEarnings,
    activeCases,
  };
};

const getInspectorById = async (inspectorId) => {
  return await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
    attributes: {
      exclude: ["userPassword"],
    },
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
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
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
  const totalBalance = await InspectorPayment.sum("paymentAmount", {
    where: {
      inspectorId,
      paymentStatus: "pending",
    },
  });

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
  });

  return {
    totalBalance: totalBalance || 0,
    payoutHistory,
  };
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
      "expertiseCode",
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
  const { notifications, payment, privacySecurity } = data;

  const inspector = await User.findOne({
    where: { userId: inspectorId },
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
  deleteInspector
};
