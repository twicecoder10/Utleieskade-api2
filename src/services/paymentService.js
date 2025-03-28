const { InspectorPayment, User, BankDetails } = require("../models/index");
const { Op, Sequelize } = require("sequelize");

const getPayments = async ({
  search,
  status,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (status) whereClause.paymentStatus = status;
  if (search) {
    whereClause[Op.or] = [
      { "$inspector.userFirstName$": { [Op.like]: `%${search}%` } },
      { "$inspector.userLastName$": { [Op.like]: `%${search}%` } },
      { "$inspector.userEmail$": { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows: payments, count: totalPayments } =
    await InspectorPayment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "inspector",
          attributes: [
            ["userFirstName", "firstName"],
            ["userLastName", "lastName"],
            ["userEmail", "email"],
            [
              Sequelize.literal(`(
                SELECT COUNT(*) FROM \`Case\`
                WHERE \`Case\`.\`inspectorId\` = \`inspector\`.\`userId\`
                AND \`Case\`.\`caseStatus\` = 'completed'
              )`),
              "completedCases",
            ],
            [
              Sequelize.literal(`(
                SELECT SUM(paymentAmount) FROM \`InspectorPayment\`
                WHERE \`InspectorPayment\`.\`inspectorId\` = \`inspector\`.\`userId\`
                AND \`InspectorPayment\`.\`paymentStatus\` = 'processed'
              )`),
              "totalPaidAmount",
            ],
          ],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
    });

  return {
    payments,
    totalPayments,
    totalPages: Math.ceil(totalPayments / limit),
    currentPage: parseInt(page),
  };
};

const getPaymentById = async (paymentId) => {
  return await InspectorPayment.findOne({
    where: { paymentId },
    include: [
      {
        model: User,
        as: "inspector",
        attributes: [
          ["userId", "inspectorId"],
          ["userFirstName", "firstName"],
          ["userLastName", "lastName"],
          ["userEmail", "email"],
        ],
        include: [
          {
            model: BankDetails,
            as: "bankDetails",
            attributes: ["bankName", "accountNumber"],
          },
        ],
      },
    ],
    attributes: [
      "paymentId",
      "paymentDate",
      "paymentStatus",
      "rejectionReason",
    ],
  });
};

const approvePayment = async (paymentId) => {
  return await InspectorPayment.update(
    { paymentStatus: "processed" },
    { where: { paymentId } }
  );
};

const rejectPayment = async (paymentId, rejectionReason) => {
  return await InspectorPayment.update(
    { paymentStatus: "rejected", rejectionReason },
    { where: { paymentId } }
  );
};

module.exports = { getPayments, approvePayment, rejectPayment, getPaymentById };
