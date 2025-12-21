const inspectorService = require("../services/inspectorService");
const responseHandler = require("../utils/responseHandler");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const bcrypt = require("bcryptjs");
const passwordGenerator = require("../utils/passwordGenerator");
const sendEmail = require("../utils/sendEmail");
const emailTemplate = require("../utils/emailTemplate");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

exports.addInspector = async (req, res) => {
  try {
    const password = passwordGenerator.generatePassword();
    const {
      userFirstName,
      userLastName,
      userEmail,
      userGender,
      userPhone,
      userCity,
      userPostcode,
      userAddress,
      userCountry,
      inspectorExpertiseCodes,
    } = req.body;

    const inspectorData = {
      userId: generateUniqueId("INSP"),
      userFirstName: userFirstName.trim(),
      userLastName: userLastName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userGender: userGender.trim().toLowerCase(),
      userPhone: userPhone.trim(),
      userCity: userCity.trim(),
      userPostcode: userPostcode.trim(),
      userAddress: userAddress.trim(),
      userCountry: (userCountry && userCountry.trim()) || "Norway", // Default to Norway
      userType: "inspector",
      userPassword: await bcrypt.hash(password, 10),
    };

    const newInspector = await inspectorService.createInspector(
      inspectorData,
      inspectorExpertiseCodes
    );

    delete newInspector["userPassword"];

    const text = emailTemplate(
      "Welcome To Utleieskade",
      `Hello ${newInspector.userFirstName} and welcome to Utleieskade as an inspector
      <p>
      Here are your signin details:
      <br> Email: ${newInspector.userEmail}
      <br> Password: ${password}
      <p>
      Kindly signin with these details at: <a href=https://utleieskade-inspector.vercel.app/>Inspector Signin</a>`
    );
    await sendEmail(userEmail, "Inspector Invitation To Utleieskade", text);

    responseHandler.setSuccess(
      201,
      "Inspector added successfully",
      newInspector
    );

    return responseHandler.send(res);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      responseHandler.setError(
        400,
        `The ${error.errors[0].path} already exists!`
      );
      return responseHandler.send(res);
    }
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getTenantDashboard = async (req, res) => {
  try {
    const { id: userId } = req.user;

    if (!userId) {
      responseHandler.setError(400, "User ID is required");
      return responseHandler.send(res);
    }

    const dashboardData = await inspectorService.getInspectorDasboard(userId);

    responseHandler.setSuccess(
      200,
      "Dashboard data retrieved successfully",
      dashboardData
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error in getTenantDashboard:", error);
    responseHandler.setError(500, error.message || "Internal server error");
    return responseHandler.send(res);
  }
};

exports.getInspectorById = async (req, res) => {
  try {
    const { inspectorId } = req.params;
    const inspector = await inspectorService.getInspectorById(inspectorId);

    if (!inspector) {
      responseHandler.setError(404, "Inspector not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      200,
      "Inspector details retrieved successfully",
      inspector
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getAllInspectors = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const inspectorsData = await inspectorService.getAllInspectors({
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    // Ensure we always return a valid response even if no inspectors found
    if (!inspectorsData) {
      return responseHandler.setSuccess(
        200,
        "Inspectors retrieved successfully",
        {
          inspectors: [],
          totalInspectors: 0,
          totalPages: 0,
          currentPage: parseInt(page) || 1,
        }
      );
    }

    responseHandler.setSuccess(
      200,
      "Inspectors retrieved successfully",
      inspectorsData
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching inspectors:", error);
    responseHandler.setError(500, error.message || "Failed to fetch inspectors");
    return responseHandler.send(res);
  }
};

exports.exportInspectors = async (req, res) => {
  try {
    const { format } = req.query;
    let inspectors = await inspectorService.exportInspectors();

    if (!inspectors.length) {
      responseHandler.setError(404, "No inspectors found to export");
      return responseHandler.send(res);
    }

    inspectors = inspectors.map((inspector, index) => ({
      "S/N": index + 1,
      Name: `${inspector.firstName} ${inspector.lastName}`,
      Email: inspector.email,
      Phone: inspector.phone,
      City: inspector.city,
      Address: inspector.address,
      Postcode: inspector.postcode,
      Country: inspector.country,
    }));

    if (format === "csv") {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(inspectors);

      res.header("Content-Type", "text/csv");
      res.attachment("inspectors.csv");
      return res.send(csv);
    } else if (format === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      res.header(
        "Content-Disposition",
        'attachment; filename="inspectors.pdf"'
      );
      res.header("Content-Type", "application/pdf");

      doc.pipe(res);

      doc.fontSize(18).text("Inspectors List", { align: "center" });
      doc.moveDown();

      const headers = Object.keys(inspectors[0]);

      doc
        .fontSize(12)
        .fillColor("black")
        .text(headers.join(" | "), { underline: true });
      doc.moveDown();

      inspectors.forEach((inspector) => {
        doc.text(Object.values(inspector).join(" | "));
      });

      doc.end();
    } else {
      responseHandler.setError(
        400,
        "Invalid format. Only 'csv' or 'pdf' exports are supported."
      );
      return responseHandler.send(res);
    }
  } catch (error) {
    console.error("Error exporting inspectors:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.deactivateInspector = async (req, res) => {
  try {
    const { inspectorId } = req.params;

    const deactivatedInspector = await inspectorService.deactivateInspector(
      inspectorId
    );

    if (!deactivatedInspector) {
      responseHandler.setError(404, "Inspector not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Inspector deactivated successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getInspectorCases = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      search: search || "",
      status: status || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder === "asc" ? "ASC" : "DESC",
      userId: req.user.id,
    };

    const cases = await inspectorService.getInspectorCases(filters);

    responseHandler.setSuccess(200, "Cases retrieved successfully", cases);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching cases:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getInspectorEarnings = async (req, res) => {
  try {
    const { id: inspectorId } = req.user;

    const earningsData = await inspectorService.getInspectorEarnings(
      inspectorId
    );

    responseHandler.setSuccess(
      200,
      "Inspector earnings retrieved",
      earningsData
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching inspector earnings:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.requestPayout = async (req, res) => {
  try {
    const { amount, userPassword, paymentId } = req.body;
    const { id: inspectorId } = req.user;

    const result = await inspectorService.requestPayout({
      inspectorId,
      amount,
      userPassword,
      paymentId, // Optional: if provided, request payout for specific payment
    });

    if (!result.success) {
      responseHandler.setError(400, result.message);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, result.message);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error requesting payout:", error);
    responseHandler.setError(400, error.message);
    return responseHandler.send(res);
  }
};

exports.sendEarningsReport = async (req, res) => {
  try {
    const { month, year } = req.body;
    const { id: inspectorId } = req.user;

    // Validate month and year
    if (!month || !year) {
      responseHandler.setError(400, "Month and year are required");
      return responseHandler.send(res);
    }

    if (month < 1 || month > 12) {
      responseHandler.setError(400, "Month must be between 1 and 12");
      return responseHandler.send(res);
    }

    if (year < 2020 || year > new Date().getFullYear() + 1) {
      responseHandler.setError(400, "Invalid year");
      return responseHandler.send(res);
    }

    const result = await inspectorService.sendEarningsReport({
      inspectorId,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (!result.success || !result.pdfBuffer) {
      responseHandler.setError(400, result.message || "Failed to generate earnings report");
      return responseHandler.send(res);
    }

    // Send PDF as download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.pdfBuffer);
  } catch (error) {
    console.error("Error generating earnings report:", error);
    responseHandler.setError(500, error.message || "Failed to generate earnings report");
    return responseHandler.send(res);
  }
};

exports.downloadPayoutPDF = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { id: inspectorId } = req.user;

    if (!paymentId) {
      responseHandler.setError(400, "Payment ID is required");
      return responseHandler.send(res);
    }

    const payoutDetails = await inspectorService.getPayoutDetails(paymentId, inspectorId);

    if (!payoutDetails) {
      responseHandler.setError(404, "Payout not found or access denied");
      return responseHandler.send(res);
    }

    const { generatePayoutPDF } = require("../utils/generatePayoutPDF");
    const pdfBuffer = await generatePayoutPDF(payoutDetails);

    // Send PDF as download
    const filename = `Payout-${payoutDetails.referenceNumber}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating payout PDF:", error);
    responseHandler.setError(500, error.message || "Failed to generate payout PDF");
    return responseHandler.send(res);
  }
};

exports.getInspectorSettings = async (req, res) => {
  try {
    const inspectorId = req.user.id;
    const settings = await inspectorService.getInspectorSettings(inspectorId);

    if (!settings) {
      responseHandler.setError(404, "Inspector not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, settings);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching inspector settings:", error);
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};

exports.updateInspectorSettings = async (req, res) => {
  try {
    const inspectorId = req.user.id;
    console.log("updateInspectorSettings controller called for inspector:", inspectorId);
    console.log("Request body keys:", Object.keys(req.body));
    
    const updateResult = await inspectorService.updateInspectorSettings(
      inspectorId,
      req.body
    );

    if (!updateResult.success) {
      console.error("Update failed:", updateResult.message);
      responseHandler.setError(400, updateResult.message);
      return responseHandler.send(res);
    }

    console.log("Settings updated successfully");
    responseHandler.setSuccess(200, updateResult.message);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error updating inspector settings:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    
    // Provide more specific error message
    let errorMessage = "Internal server error";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code === '23505') {
      errorMessage = "Duplicate entry. This value already exists.";
    } else if (error.code === '23503') {
      errorMessage = "Invalid reference. One of the values doesn't exist.";
    } else if (error.message && error.message.includes("column") && error.message.includes("does not exist")) {
      errorMessage = "Database schema mismatch. Please contact support.";
    }
    
    responseHandler.setError(500, errorMessage);
    return responseHandler.send(res);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id: inspectorId } = req.user;

    if (!currentPassword || !newPassword) {
      responseHandler.setError(400, "Current password and new password are required");
      return responseHandler.send(res);
    }

    if (newPassword.length < 6) {
      responseHandler.setError(400, "New password must be at least 6 characters");
      return responseHandler.send(res);
    }

    const user = await inspectorService.getInspectorById(inspectorId, true);

    if (!user) {
      responseHandler.setError(404, "Inspector not found");
      return responseHandler.send(res);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.userPassword
    );

    if (!isPasswordValid) {
      responseHandler.setError(403, "Current password is incorrect");
      return responseHandler.send(res);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await inspectorService.updateInspectorPassword(inspectorId, hashedPassword);

    responseHandler.setSuccess(200, "Password changed successfully");
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error changing password:", error);
    responseHandler.setError(500, error.message || "Internal server error");
    return responseHandler.send(res);
  }
};

exports.deleteInspector = async (req, res) => {
  try {
    const deletedInspector = await inspectorService.deleteInspector(
      req.user.id
    );

    if (!deletedInspector) {
      responseHandler.setError(404, "Inspector not found");
      return responseHandler.send(res);
    }
    responseHandler.setSuccess(200, "Inspector deleted successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getInspectorReports = async (req, res) => {
  try {
    const { id: inspectorId } = req.user;
    const { page = 1, limit = 20, search = "" } = req.query;

    const reportsData = await inspectorService.getInspectorReports({
      inspectorId,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });

    responseHandler.setSuccess(
      200,
      "Inspector reports retrieved successfully",
      reportsData
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching inspector reports:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getReportPreview = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { id: inspectorId } = req.user;

    const reportPreview = await inspectorService.getReportPreview(caseId, inspectorId);

    if (!reportPreview) {
      responseHandler.setError(404, "Report not found for this case");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Report preview retrieved successfully", reportPreview);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching report preview:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { id: inspectorId } = req.user;

    const deleted = await inspectorService.deleteReport(reportId, inspectorId);

    if (!deleted) {
      responseHandler.setError(404, "Report not found or you don't have permission to delete it");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Report deleted successfully");
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error deleting report:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getReportPdf = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { id: inspectorId } = req.user;

    const pdfData = await inspectorService.getReportPdf(reportId, inspectorId);

    if (!pdfData) {
      responseHandler.setError(404, "Report not found or you don't have permission to access it");
      return responseHandler.send(res);
    }

    // If pdfData is a URL, redirect to it
    if (typeof pdfData === 'string' && pdfData.startsWith('http')) {
      return res.redirect(pdfData);
    }

    // If pdfData is a buffer, send it as PDF
    if (Buffer.isBuffer(pdfData)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportId.substring(0, 8)}.pdf`);
      return res.send(pdfData);
    }

    responseHandler.setError(500, "Invalid PDF data format");
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching report PDF:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};