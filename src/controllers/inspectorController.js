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
      userCountry: userCountry.trim(),
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

    const dashboardData = await inspectorService.getInspectorDasboard(userId);

    responseHandler.setSuccess(
      200,
      "Dashboard data retrieved successfully",
      dashboardData
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
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
    const { amount, userPassword } = req.body;
    const { id: inspectorId } = req.user;

    const result = await inspectorService.requestPayout({
      inspectorId,
      amount,
      userPassword,
    });

    responseHandler.setSuccess(200, result.message);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error requesting payout:", error);
    responseHandler.setError(400, error.message);
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
    const updateResult = await inspectorService.updateInspectorSettings(
      inspectorId,
      req.body
    );

    if (!updateResult.success) {
      responseHandler.setError(400, updateResult.message);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, updateResult.message);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error updating inspector settings:", error);
    responseHandler.setError(500, "Internal server error");
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
