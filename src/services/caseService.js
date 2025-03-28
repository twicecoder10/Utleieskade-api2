const ReportPhoto = require("../models/ReportPhoto");
const {
  Case,
  User,
  CaseTimeline,
  Damage,
  DamagePhoto,
  Property,
  Report,
  AssessmentItem,
  AssessmentSummary,
} = require("../models/index");
const { Op } = require("sequelize");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

const createCase = async (caseData) => {
  const {
    userId,
    propertyId,
    buildingNumber,
    damages,
    caseUrgencyLevel,
    caseDescription,
    caseDeadline,
  } = caseData;

  const newCase = await Case.create({
    caseId: generateUniqueId("CASE"),
    userId,
    propertyId,
    buildingNumber,
    caseUrgencyLevel,
    caseDescription,
    caseDeadline,
  });

  for (const damage of damages) {
    const createdDamage = await Damage.create({
      caseId: newCase.caseId,
      damageLocation: damage.damageLocation,
      damageType: damage.damageType,
      damageDescription: damage.damageDescription,
      damageDate: damage.damageDate,
    });

    if (damage.photos && damage.photos.length > 0) {
      const damagePhotos = damage.photos.map((photo) => ({
        damageId: createdDamage.damageId,
        photoType: photo.photoType,
        photoUrl: photo.photoUrl,
      }));

      await DamagePhoto.bulkCreate(damagePhotos);
    }
  }

  return newCase;
};

const getAllCases = async ({
  search,
  status,
  page,
  limit,
  sortBy,
  sortOrder,
  userId,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (userId) {
    whereClause.userId = userId;
  }

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
      {
        model: Property,
        as: "property",
        attributes: [
          "propertyId",
          "propertyType",
          "propertyCity",
          "propertyAddress",
          "propertyCountry",
        ],
      },
      {
        model: Damage,
        as: "damages",
        include: [
          {
            model: DamagePhoto,
            as: "damagePhotos",
            required: false,
          },
        ],
      },
      {
        model: CaseTimeline,
        as: "timeline",
        separate: true,
        order: [["eventTimestamp", "ASC"]],
      },
      {
        model: Report,
        as: "reports",
        include: [
          {
            model: ReportPhoto,
            as: "reportPhotos",
            // attributes: [],
            required: false,
          },
        ],
      },
    ],
  });
};

const updateCaseStatus = async (caseId, status) => {
  const caseToUpdate = await Case.findOne({ where: { caseId } });

  if (!caseToUpdate) return null;

  await Case.update({ caseStatus: status }, { where: { caseId } });

  return { message: "Case status updated successfully" };
};

const cancelCase = async (caseId, cancellationReason) => {
  const caseToUpdate = await Case.findOne({ where: { caseId } });

  if (!caseToUpdate) return null;

  await Case.update(
    { caseStatus: "cancelled", cancellationReason },
    { where: { caseId } }
  );

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

const reportAssessment = async (reportData) => {
  const {
    inspectorId,
    caseId,
    reportDescription,
    photos = [],
    items = [],
    summary,
  } = reportData;

  const newReport = await Report.create({
    inspectorId,
    caseId,
    reportDescription,
  });

  if (photos.length > 0) {
    const reportPhotos = photos.map((photo) => ({
      reportId: newReport.reportId,
      photoUrl: photo.photoUrl,
    }));
    await ReportPhoto.bulkCreate(reportPhotos);
  }

  if (items.length > 0) {
    const formattedItems = items.map((item) => ({
      ...item,
      reportId: newReport.reportId,
    }));
    await AssessmentItem.bulkCreate(formattedItems);
  }

  if (summary) {
    await AssessmentSummary.create({
      reportId: newReport.reportId,
      ...summary,
    });
  }

  return newReport;
};

const extendCaseDeadline = async (caseId, newDeadline) => {
  const caseToUpdate = await Case.findOne({ where: { caseId } });
  if (!caseToUpdate) return null;

  caseToUpdate.caseDeadline = newDeadline;
  await caseToUpdate.save();

  return caseToUpdate;
};

module.exports = {
  createCase,
  getAllCases,
  getCaseDetails,
  cancelCase,
  assignCase,
  logCaseEvent,
  getCaseTimeline,
  reportAssessment,
  updateCaseStatus,
  extendCaseDeadline,
};
