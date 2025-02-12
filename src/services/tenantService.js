const { User, Payment, Case } = require("../models/index");
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
          SELECT COUNT(*) FROM \`case\`
          WHERE \`case\`.\`userId\` = \`User\`.\`userId\`
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

const getTenantTransactions = async (tenantId) => {
  return await Payment.findAll({
    include: [
      {
        model: Case,
        where: { userId: tenantId },
        attributes: ["caseId"],
        include: [
          {
            model: User,
            as: "inspector",
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
    order: [["paymentDate", "DESC"]],
  });
};

const deactivateTenant = async (tenantId) => {
  const tenant = await User.findOne({
    where: { userId: tenantId, userType: "tenant" },
  });

  if (!tenant) return null;

  await tenant.update({ userStatus: "inactive" });
  return tenant;
};

module.exports = {
  getAllTenants,
  getTenantTransactions,
  getTenantById,
  deactivateTenant,
  exportTenants,
};
