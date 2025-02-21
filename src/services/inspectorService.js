const { User, Case, InspectorPayment } = require("../models/index");
const { Op } = require("sequelize");

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

module.exports = {
  getInspectorById,
  getAllInspectors,
  createInspector,
  exportInspectors,
  deactivateInspector,
  getInspectorDasboard,
  getInspectorCases,
};
