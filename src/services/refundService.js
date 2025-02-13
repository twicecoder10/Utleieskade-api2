const { Refund, Case, User } = require("../models/index");
const { Op } = require("sequelize");
const { logCaseEvent } = require("./caseService");

const getRefunds = async ({
  search,
  status,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (status) whereClause.refundStatus = status;
  if (search) {
    whereClause[Op.or] = [
      { "$caseDetails.caseId$": { [Op.like]: `%${search}%` } },
      { "$caseDetails.caseDescription$": { [Op.like]: `%${search}%` } },
      { "$customer.userFirstName$": { [Op.like]: `%${search}%` } },
      { "$customer.userLastName$": { [Op.like]: `%${search}%` } },
      { "$customer.userEmail$": { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows: refunds, count: totalRefunds } = await Refund.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Case,
        as: "caseDetails",
        attributes: ["caseId", "caseDescription", "createdAt"],
        include: [
          {
            model: User,
            as: "tenant",
            attributes: ["userFirstName", "userLastName", "userEmail"],
          },
        ],
      },
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    refunds,
    totalRefunds,
    totalPages: Math.ceil(totalRefunds / limit),
    currentPage: parseInt(page),
  };
};

const getRefundById = async (refundId) => {
  return await Refund.findOne({
    where: { refundId },
    include: [
      {
        model: Case,
        as: "caseDetails",
        attributes: ["caseId", "caseDescription", "createdAt"],
        include: [
          {
            model: User,
            as: "tenant",
            attributes: [
              "userFirstName",
              "userLastName",
              "userEmail",
              "userPhone",
              "userAddress",
            ],
          },
        ],
      },
    ],
  });
};

const approveRefund = async (refundId) => {
  const refund = await Refund.findOne({ where: { refundId } });

  if (!refund) return null;

  await Refund.update({ refundStatus: "processed" }, { where: { refundId } });

  await logCaseEvent(
    refund.caseId,
    "other",
    `Refund of £${refund.amount} processed.`
  );

  return refund;
};

const rejectRefund = async (refundId) => {
  const refund = await Refund.findOne({ where: { refundId } });

  if (!refund) return null;

  await Refund.update(
    { refundStatus: "rejected" },
    { where: { refundId } }
  );

  await logCaseEvent(refund.caseId, "other", `Refund request rejected.`);

  return refund;
};

module.exports = { getRefunds, getRefundById, approveRefund, rejectRefund };
