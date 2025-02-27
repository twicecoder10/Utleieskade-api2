const {
  User,
  Payment,
  InspectorPayment,
  Refund,
  Case,
} = require("../models/index");
const { Op, Sequelize } = require("sequelize");

const getAdminDashboardData = async () => {
  const totalUsers = await User.count();
  const totalInspectors = await User.count({
    where: { userType: "inspector" },
  });
  const totalTenants = await User.count({ where: { userType: "tenant" } });
  const totalLandlords = await User.count({ where: { userType: "landlord" } });

  const totalRevenue = await Payment.sum("paymentAmount", {
    where: { paymentStatus: "processed" },
  });

  const totalPayouts = await InspectorPayment.sum("paymentAmount", {
    where: { paymentStatus: "processed" },
  });

  const totalRefunds = await Refund.sum("amount", {
    where: { refundStatus: "processed" },
  });

  const totalCases = await Case.count();
  const totalCompleted = await Case.count({ where: { caseStatus: "closed" } });
  const totalCancelled = await Case.count({
    where: { caseStatus: "cancelled" },
  });

  const usersOverview = await User.findAll({
    attributes: [
      [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "month"],
      [Sequelize.fn("COUNT", Sequelize.col("userId")), "totalUsers"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(`CASE WHEN userType='inspector' THEN 1 ELSE 0 END`)
        ),
        "totalInspectors",
      ],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(`CASE WHEN userType='tenant' THEN 1 ELSE 0 END`)
        ),
        "totalTenants",
      ],
    ],
    group: ["month"],
    raw: true,
  });

  const revenueOverview = await Payment.findAll({
    attributes: [
      [Sequelize.fn("MONTH", Sequelize.col("paymentDate")), "month"],
      [Sequelize.fn("SUM", Sequelize.col("paymentAmount")), "totalRevenue"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(
            `(SELECT SUM(paymentAmount) FROM InspectorPayment WHERE MONTH(paymentDate) = MONTH(Payment.paymentDate))`
          )
        ),
        "totalPayouts",
      ],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(
            `(SELECT SUM(amount) FROM Refund WHERE MONTH(requestDate) = MONTH(Payment.paymentDate))`
          )
        ),
        "totalRefunds",
      ],
    ],
    group: ["month"],
    raw: true,
  });

  const casesOverview = await Case.findAll({
    attributes: [
      [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "month"],
      [Sequelize.fn("COUNT", Sequelize.col("caseId")), "totalCases"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(`CASE WHEN caseStatus='closed' THEN 1 ELSE 0 END`)
        ),
        "totalCompleted",
      ],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(
            `CASE WHEN caseStatus='cancelled' THEN 1 ELSE 0 END`
          )
        ),
        "totalCancelled",
      ],
    ],
    group: ["month"],
    raw: true,
  });

  return {
    totalUsers,
    totalInspectors,
    totalTenants,
    totalLandlords,
    totalRevenue,
    totalPayouts,
    totalRefunds,
    totalCases,
    totalCompleted,
    totalCancelled,
    overviewGraphs: {
      users: usersOverview,
      revenue: revenueOverview,
      cases: casesOverview,
    },
  };
};

const getAllAdmins = async ({
  search,
  status,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const offset = (page - 1) * limit;
  const whereClause = { userType: "sub-admin" };

  if (search) {
    whereClause[Op.or] = [
      { userFirstName: { [Op.like]: `%${search}%` } },
      { userLastName: { [Op.like]: `%${search}%` } },
      { userEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) {
    whereClause.userStatus = status;
  }

  const { rows: admins, count: totalAdmins } = await User.findAndCountAll({
    where: whereClause,
    attributes: [
      ["userId", "adminId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userStatus", "status"],
      ["createdAt", "dateRegistered"],
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    admins,
    totalAdmins,
    totalPages: Math.ceil(totalAdmins / limit),
    currentPage: parseInt(page),
  };
};

const getAdminById = async (adminId) => {
  return await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
    attributes: [
      ["userId", "adminId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userStatus", "status"],
      ["createdAt", "dateRegistered"],
    ],
  });
};

const updateAdmin = async (adminId, { firstName, lastName, email }) => {
  const admin = await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
  });
  if (!admin) return null;

  await admin.update({
    userFirstName: firstName || admin.userFirstName,
    userLastName: lastName || admin.userLastName,
    userEmail: email || admin.userEmail,
  });

  return await User.findOne({
    where: { userId: adminId },
    attributes: { exclude: ["userPassword"] },
  });
};

const deleteAdmin = async (adminId) => {
  const admin = await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
  });
  if (!admin) return null;

  await admin.destroy();
  return admin;
};

module.exports = {
  getAdminDashboardData,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
