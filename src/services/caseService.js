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
const { generateReportPDF } = require("../utils/generateReportPDF");

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
  const caseDetails = await Case.findOne({
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
        required: false,
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
          "userProfilePic",
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
        required: false,
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
        order: [["eventTimestamp", "DESC"]],
        required: false,
      },
      {
        model: Report,
        as: "reports",
        include: [
          {
            model: ReportPhoto,
            as: "reportPhotos",
            required: false,
          },
        ],
        required: false,
      },
    ],
  });

  // Convert to plain JSON to ensure all nested data is properly serialized
  if (caseDetails) {
    return caseDetails.toJSON ? caseDetails.toJSON() : caseDetails;
  }
  
  return null;
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
  try {
    const {
      inspectorId,
      caseId,
      reportDescription,
      photos = [],
      items = [],
      summary,
    } = reportData;

    // Validate required fields
    if (!inspectorId) {
      throw new Error("Inspector ID is required");
    }
    if (!caseId) {
      throw new Error("Case ID is required");
    }

    // Verify case exists and is assigned to this inspector
    const caseItem = await Case.findOne({
      where: { caseId, inspectorId },
    });

    if (!caseItem) {
      throw new Error("Case not found or not assigned to you");
    }

    // Create the report
    const newReport = await Report.create({
      inspectorId,
      caseId,
      reportDescription: reportDescription || "",
    });

    if (!newReport || !newReport.reportId) {
      throw new Error("Failed to create report");
    }

    // Create report photos if provided
    if (photos && Array.isArray(photos) && photos.length > 0) {
      const reportPhotos = photos
        .filter((photo) => photo && photo.photoUrl)
        .map((photo) => ({
          reportId: newReport.reportId,
          photoUrl: photo.photoUrl,
        }));
      
      if (reportPhotos.length > 0) {
        await ReportPhoto.bulkCreate(reportPhotos);
      }
    }

    // Create assessment items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const formattedItems = items.map((item) => ({
        reportId: newReport.reportId,
        item: item.item || "",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        hours: item.hours || 0,
        hourlyRate: item.hourlyRate || 0,
        sumMaterial: item.sumMaterial || 0,
        sumWork: item.sumWork || 0,
        sumPost: item.sumPost || 0,
      }));
      await AssessmentItem.bulkCreate(formattedItems);
    }

    // Create assessment summary if provided
    // Use findOrCreate to avoid duplicate key errors
    if (summary) {
      try {
        const [assessmentSummary, created] = await AssessmentSummary.findOrCreate({
          where: { reportId: newReport.reportId },
          defaults: {
            reportId: newReport.reportId,
            totalHours: summary.totalHours || 0,
            totalSumMaterials: summary.totalSumMaterials || 0,
            totalSumLabor: summary.totalSumLabor || 0,
            sumExclVAT: summary.sumExclVAT || 0,
            vat: summary.vat || 0,
            sumInclVAT: summary.sumInclVAT || 0,
            total: summary.total || 0,
          },
        });

        // If it already exists, update it instead
        if (!created) {
          await assessmentSummary.update({
            totalHours: summary.totalHours || 0,
            totalSumMaterials: summary.totalSumMaterials || 0,
            totalSumLabor: summary.totalSumLabor || 0,
            sumExclVAT: summary.sumExclVAT || 0,
            vat: summary.vat || 0,
            sumInclVAT: summary.sumInclVAT || 0,
            total: summary.total || 0,
          });
        }
      } catch (summaryError) {
        console.error("Error creating/updating assessment summary:", summaryError);
        // If findOrCreate fails, try to delete existing and create new
        try {
          await AssessmentSummary.destroy({ where: { reportId: newReport.reportId } });
          await AssessmentSummary.create({
            reportId: newReport.reportId,
            totalHours: summary.totalHours || 0,
            totalSumMaterials: summary.totalSumMaterials || 0,
            totalSumLabor: summary.totalSumLabor || 0,
            sumExclVAT: summary.sumExclVAT || 0,
            vat: summary.vat || 0,
            sumInclVAT: summary.sumInclVAT || 0,
            total: summary.total || 0,
          });
        } catch (fallbackError) {
          console.error("Error in fallback summary creation:", fallbackError);
          // Don't throw - allow report to be created even if summary fails
          console.warn("Continuing without assessment summary due to error");
        }
      }
    }

    // Update case status to completed
    await Case.update(
      { caseStatus: "completed" },
      { where: { caseId } }
    );

    // Log the event
    await logCaseEvent(
      caseId,
      "caseCompleted",
      `Case completed with assessment report`
    );

    // Generate PDF and upload to Azure
    try {
      console.log(`🔄 Starting PDF generation for report ${newReport.reportId}, case ${caseId}`);
      
      // Get full case details for PDF generation
      const fullCaseData = await getCaseDetails(caseId);
      
      if (!fullCaseData) {
        console.error(`❌ Could not fetch case details for PDF generation for case ${caseId}`);
        throw new Error(`Case details not found for case ${caseId}`);
      }

      console.log(`✅ Case details retrieved for PDF generation`);

      // Generate PDF with report data
      console.log(`🔄 Generating PDF...`);
      const pdfUrl = await generateReportPDF(
        {
          reportDescription: reportDescription || "",
          photos: photos || [],
          items: items || [],
          summary: summary || null,
        },
        fullCaseData,
        newReport.reportId
      );

      if (!pdfUrl) {
        throw new Error("PDF generation returned null or undefined URL");
      }

      console.log(`✅ PDF generated successfully, URL: ${pdfUrl}`);

      // Update report with PDF URL
      try {
        await newReport.update({ pdfUrl });
        console.log(`✅ PDF URL saved to database for report ${newReport.reportId}: ${pdfUrl}`);
      } catch (updateError) {
        console.error(`❌ Error updating report with PDF URL:`, updateError);
        console.error(`❌ Update error details:`, {
          message: updateError.message,
          stack: updateError.stack,
          reportId: newReport.reportId,
          pdfUrl: pdfUrl,
        });
        // Check if it's a column not found error
        if (updateError.message && (updateError.message.includes('column') && updateError.message.includes('does not exist'))) {
          console.error(`❌ Database column 'pdfUrl' does not exist. Please run the migration: addReportPdfUrlColumn.sql`);
        }
        throw updateError;
      }
    } catch (pdfError) {
      console.error("❌ Error generating PDF for report:", pdfError);
      console.error("❌ PDF error details:", {
        message: pdfError.message,
        stack: pdfError.stack,
        reportId: newReport.reportId,
        caseId: caseId,
      });
      // Don't fail the report creation if PDF generation fails
      // The report will be created without PDF URL
      console.warn("⚠️  Report created successfully but PDF generation failed. PDF can be generated later.");
      // Re-throw to see the error in logs, but don't fail the report creation
    }

    // Return updated report with PDF URL
    await newReport.reload();
    return newReport;
  } catch (error) {
    console.error("Error in reportAssessment service:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
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
