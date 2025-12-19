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
  Payment,
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

  // Validate and parse caseDeadline if provided
  let validatedDeadline = null;
  if (caseDeadline) {
    const parsedDeadline = new Date(caseDeadline);
    if (!isNaN(parsedDeadline.getTime())) {
      validatedDeadline = parsedDeadline;
    } else {
      console.warn(`Invalid caseDeadline provided: ${caseDeadline}, setting to null`);
      validatedDeadline = null;
    }
  }

  const newCase = await Case.create({
    caseId: generateUniqueId("CASE"),
    userId,
    propertyId,
    buildingNumber,
    caseUrgencyLevel,
    caseDescription,
    caseDeadline: validatedDeadline,
  });

  for (const damage of damages) {
    // Validate and parse damageDate
    let damageDate = null;
    if (damage.damageDate) {
      const parsedDate = new Date(damage.damageDate);
      if (!isNaN(parsedDate.getTime())) {
        damageDate = parsedDate;
      } else {
        console.warn(`Invalid damageDate provided: ${damage.damageDate}, using current date`);
        damageDate = new Date();
      }
    } else {
      // Default to current date if not provided
      damageDate = new Date();
    }

    const createdDamage = await Damage.create({
      caseId: newCase.caseId,
      damageLocation: damage.damageLocation,
      damageType: damage.damageType,
      damageDescription: damage.damageDescription,
      damageDate: damageDate,
    });

    if (damage.photos && damage.photos.length > 0) {
      console.log(`📸 Processing ${damage.photos.length} photos for damage ${createdDamage.damageId}`);
      
      // Filter out photos with invalid or missing photoUrl
      const validPhotos = damage.photos.filter((photo) => {
        const isValid = photo && photo.photoUrl && typeof photo.photoUrl === 'string' && photo.photoUrl.trim().length > 0;
        if (!isValid) {
          console.warn(`⚠️  Invalid photo skipped:`, { photo, reason: !photo ? 'photo is null/undefined' : !photo.photoUrl ? 'photoUrl missing' : 'photoUrl is not a string or empty' });
        }
        return isValid;
      });

      console.log(`✅ Found ${validPhotos.length} valid photos out of ${damage.photos.length}`);

      if (validPhotos.length > 0) {
        const damagePhotos = validPhotos.map((photo) => ({
          damageId: createdDamage.damageId,
          photoType: photo.photoType || 'general', // Default photoType if not provided
          photoUrl: photo.photoUrl.trim(), // Ensure no whitespace
        }));

        console.log(`💾 Saving ${damagePhotos.length} photos to database for damage ${createdDamage.damageId}`);
        const createdPhotos = await DamagePhoto.bulkCreate(damagePhotos);
        console.log(`✅ Successfully saved ${createdPhotos.length} photos for damage ${createdDamage.damageId}`);
      } else {
        console.warn(`⚠️  No valid photos found for damage ${createdDamage.damageId}, skipping photo creation`);
      }
    } else {
      console.log(`ℹ️  No photos provided for damage ${createdDamage.damageId}`);
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
      ["caseUrgencyLevel", "urgencyLevel"],
      "createdAt",
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
      {
        model: Payment,
        as: "payments",
        attributes: ["paymentId", "paymentAmount", "paymentDate", "paymentStatus"],
        required: false,
        separate: false, // Include payments in the same query
      },
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  // Ensure payments are properly included in the response
  const casesWithPayments = cases.map((caseItem) => {
    const caseData = caseItem.toJSON ? caseItem.toJSON() : caseItem;
    // Ensure payments array exists and is accessible
    if (caseData.payments && Array.isArray(caseData.payments)) {
      caseData.payments = caseData.payments.map((payment) => 
        payment.toJSON ? payment.toJSON() : payment
      );
    }
    return caseData;
  });

  return {
    cases: casesWithPayments,
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
        attributes: [
          "damageId",
          "damageLocation",
          "damageType",
          "damageDescription",
          "damageDate",
        ],
        include: [
          {
            model: DamagePhoto,
            as: "damagePhotos",
            attributes: ["photoId", "photoUrl", "photoType"],
            required: false,
          },
        ],
        required: false,
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

  // Prevent claiming if case is already assigned to another inspector
  if (caseInstance.inspectorId && caseInstance.inspectorId !== inspectorId) {
    throw new Error("Case is already claimed by another inspector");
  }

  caseInstance.inspectorId = inspectorId;
  await caseInstance.save();
  return caseInstance;
};

const releaseCase = async (caseId, inspectorId) => {
  const caseInstance = await Case.findOne({ where: { caseId } });
  if (!caseInstance) return null;

  // Only allow the assigned inspector or admin to release
  if (caseInstance.inspectorId !== inspectorId) {
    throw new Error("You can only release cases that you have claimed");
  }

  caseInstance.inspectorId = null;
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
  releaseCase,
  logCaseEvent,
  getCaseTimeline,
  reportAssessment,
  updateCaseStatus,
  extendCaseDeadline,
};
