const caseService = require("../services/caseService");
const responseHandler = require("../utils/responseHandler");

exports.reportDamage = async (req, res) => {
  try {
    const caseData = req.body;
    const { id } = req.user;

    console.log("📋 Creating case with data:", {
      userId: id,
      propertyId: caseData.propertyId,
      damagesCount: caseData.damages?.length || 0,
      totalPhotos: caseData.damages?.reduce((sum, d) => sum + (d.photos?.length || 0), 0) || 0,
    });

    const newCase = await caseService.createCase({ ...caseData, userId: id });

    console.log("✅ Case created successfully:", newCase.caseId);

    responseHandler.setSuccess(201, "Case created successfully", {
      caseId: newCase.caseId,
    });

    return responseHandler.send(res);
  } catch (error) {
    console.error("❌ Error creating case:", error);
    console.error("Error stack:", error.stack);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getCases = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      search: search || "",
      status: status || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder === "asc" ? "ASC" : "DESC",
    };

    const cases = await caseService.getAllCases(filters);

    responseHandler.setSuccess(200, "Cases retrieved successfully", cases);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching cases:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getCaseDetails = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Validate caseId is provided
    if (!caseId) {
      responseHandler.setError(400, "Case ID is required");
      return responseHandler.send(res);
    }

    console.log(`[getCaseDetails] Fetching case: ${caseId}`);
    const caseDetails = await caseService.getCaseDetails(caseId);

    if (!caseDetails) {
      console.log(`[getCaseDetails] Case not found: ${caseId}`);
      responseHandler.setError(404, "Case not found");
      return responseHandler.send(res);
    }

    console.log(`[getCaseDetails] Case found: ${caseId}, returning details`);
    responseHandler.setSuccess(
      200,
      "Case details retrieved successfully",
      caseDetails
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("[getCaseDetails] Error:", error);
    console.error("[getCaseDetails] Error stack:", error.stack);
    const errorMessage = error.message || "Internal server error";
    responseHandler.setError(500, errorMessage);
    return responseHandler.send(res);
  }
};

exports.cancelCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { cancellationReason } = req.body;

    if (!cancellationReason) {
      responseHandler.setError(400, "Cancellation reason is required.");
      return responseHandler.send(res);
    }

    const result = await caseService.cancelCase(caseId, cancellationReason);

    if (!result) {
      responseHandler.setError(404, "Case not found.");
      return responseHandler.send(res);
    }

    await caseService.logCaseEvent(caseId, "caseCancelled", `Case cancelled`);

    responseHandler.setSuccess(200, "Case cancelled successfully.");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.updateCaseStatus = async (req, res) => {
  try {
    const { caseId, status } = req.params;

    if (!status) {
      responseHandler.setError(400, "Status is required.");
      return responseHandler.send(res);
    }
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "cancelled") {
      responseHandler.setError(
        400,
        "Cancellation is not allowed through status update."
      );
      return responseHandler.send(res);
    }

    const ALLOWED_STATUSES = ["open", "completed", "on-hold", "pending", "in-progress"];

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      responseHandler.setError(
        400,
        `Status type of ${status} is not recognized. Allowed statuses: ${ALLOWED_STATUSES.join(", ")}`
      );
      return responseHandler.send(res);
    }

    const result = await caseService.updateCaseStatus(caseId, normalizedStatus);

    if (!result) {
      responseHandler.setError(404, "Case not found.");
      return responseHandler.send(res);
    }

    await caseService.logCaseEvent(
      caseId,
      "statusChange",
      `Case status changed to ${normalizedStatus}`
    );

    responseHandler.setSuccess(200, "Case status updated successfully.");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.assignCase = async (req, res) => {
  try {
    const { caseId, inspectorId } = req.params;
    const updatedCase = await caseService.assignCase(caseId, inspectorId);

    if (!updatedCase) {
      responseHandler.setError(404, "Case or inspector not found");
      return responseHandler.send(res);
    }

    await caseService.logCaseEvent(
      caseId,
      "inspectorAssigned",
      `Inspector assigned`
    );

    responseHandler.setSuccess(
      200,
      "Inspector assigned successfully",
      updatedCase
    );
    return responseHandler.send(res);
  } catch (error) {
    if (error.message && error.message.includes("already claimed")) {
      responseHandler.setError(400, error.message);
      return responseHandler.send(res);
    }
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.releaseCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { id: inspectorId } = req.user;
    
    const updatedCase = await caseService.releaseCase(caseId, inspectorId);

    if (!updatedCase) {
      responseHandler.setError(404, "Case not found");
      return responseHandler.send(res);
    }

    await caseService.logCaseEvent(
      caseId,
      "caseReleased",
      `Case released by inspector`
    );

    responseHandler.setSuccess(
      200,
      "Case released successfully",
      updatedCase
    );
    return responseHandler.send(res);
  } catch (error) {
    if (error.message && error.message.includes("can only release")) {
      responseHandler.setError(403, error.message);
      return responseHandler.send(res);
    }
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getCaseTimeline = async (req, res) => {
  try {
    const { caseId } = req.params;
    const timeline = await caseService.getCaseTimeline(caseId);

    responseHandler.setSuccess(
      200,
      "Case timeline retrieved successfully",
      timeline
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.reportAssessment = async (req, res) => {
  try {
    const reportData = req.body;
    const { id } = req.user;

    // Validate required fields
    if (!reportData) {
      responseHandler.setError(400, "Report data is required");
      return responseHandler.send(res);
    }

    if (!reportData.caseId) {
      responseHandler.setError(400, "Case ID is required");
      return responseHandler.send(res);
    }

    if (!reportData.items || !Array.isArray(reportData.items) || reportData.items.length < 1) {
      responseHandler.setError(400, "At least one assessment item is required");
      return responseHandler.send(res);
    }

    if (!reportData.summary) {
      responseHandler.setError(400, "Summary is required");
      return responseHandler.send(res);
    }

    const newReport = await caseService.reportAssessment({
      ...reportData,
      inspectorId: id,
    });

    if (!newReport) {
      responseHandler.setError(500, "Failed to create report");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(201, "Assessment reported successfully", {
      reportId: newReport.reportId,
    });

    return responseHandler.send(res);
  } catch (error) {
    console.error("Error creating report assessment:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    const errorMessage = error.message || "Internal server error";
    responseHandler.setError(500, errorMessage);
    return responseHandler.send(res);
  }
};

exports.extendCaseDeadline = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { newDeadline } = req.body;

    if (!newDeadline) {
      responseHandler.setError(400, "New deadline is required.");
      return responseHandler.send(res);
    }

    const updated = await caseService.extendCaseDeadline(caseId, newDeadline);

    if (!updated) {
      responseHandler.setError(404, "Case not found.");
      return responseHandler.send(res);
    }

    await caseService.logCaseEvent(
      caseId,
      "deadlineExtended",
      `Deadline extended to ${newDeadline}`
    );

    responseHandler.setSuccess(200, "Case deadline extended successfully.");
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error extending deadline:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};
