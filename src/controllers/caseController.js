const caseService = require("../services/caseService");
const responseHandler = require("../utils/responseHandler");

exports.reportDamage = async (req, res) => {
  try {
    const caseData = req.body;
    const { id } = req.user;

    const newCase = await caseService.createCase({ ...caseData, userId: id });

    responseHandler.setSuccess(201, "Case created successfully", {
      caseId: newCase.caseId,
    });

    return responseHandler.send(res);
  } catch (error) {
    console.error("Error creating case:", error);
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
    const caseDetails = await caseService.getCaseDetails(caseId);

    if (!caseDetails) {
      responseHandler.setError(404, "Case not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      200,
      "Case details retrieved successfully",
      caseDetails
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
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

    const newReport = await caseService.reportAssessment({
      ...reportData,
      inspectorId: id,
    });

    responseHandler.setSuccess(201, "Assessment reported successfully", {
      reportId: newReport.reportId,
    });

    return responseHandler.send(res);
  } catch (error) {
    console.error("Error creating case:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};
