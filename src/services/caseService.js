const { Case, User, CaseTimeline } = require("../models/index");
const { Op } = require("sequelize");

const createCase = async (caseData) => {
  const newCase = await Case.create(caseData);
  return newCase;
};

const getAllCases = async ({
  search,
  status,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

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
        attributes: [["userId", "tenantId"], "userFirstName", "userLastName"],
      },
      {
        model: User,
        as: "inspector",
        attributes: [
          ["userId", "inspectorId"],
          "userFirstName",
          "userLastName",
        ],
        required: false,
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

const getCaseDetails = async (caseId) => {
  return await Case.findOne({
    where: { caseId },
    include: [
      {
        model: User,
        as: "tenant",
        attributes: [
          "userId",
          "userFirstName",
          "userLastName",
          "userPhone",
          "userEmail",
          "userAddress",
        ],
      },
      {
        model: User,
        as: "inspector",
        attributes: [
          "userId",
          "userFirstName",
          "userLastName",
          "userPhone",
          "userEmail",
          "userAddress",
        ],
        required: false,
      },
    ],
  });
};

const cancelCase = async (caseId, cancellationReason) => {
  const caseToUpdate = await Case.findOne({ where: { caseId } });

  if (!caseToUpdate) return null;

  await Case.update({ caseStatus: "cancelled", cancellationReason }, { where: { caseId } });

  return { message: "Case cancelled successfully" };
};
const assignCase = async (caseId, inspectorId) => {
  const caseInstance = await Case.findOne({ where: { caseId } });
  if (!caseInstance) return null;

  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
  });
  if (!inspector) return null;

  caseInstance.inspectorId = inspectorId;
  await caseInstance.save();
  return caseInstance;
};

const getCaseTimeline = async (caseId) => {
  return await CaseTimeline.findAll({
    where: { caseId },
    attributes: ["eventType", "eventDescription", "eventTimestamp"],
    order: [["eventTimestamp", "ASC"]],
  });
};

const logCaseEvent = async (caseId, eventType, eventDescription) => {
  return await CaseTimeline.create({
    caseId,
    eventType,
    eventDescription,
  });
};

module.exports = {
  createCase,
  getAllCases,
  getCaseDetails,
  cancelCase,
  assignCase,
  logCaseEvent,
  getCaseTimeline,
};
