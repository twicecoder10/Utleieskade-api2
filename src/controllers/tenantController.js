const tenantService = require("../services/tenantService");
const responseHandler = require("../utils/responseHandler");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

exports.getTenantDashboard = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const dashboardData = await tenantService.getTenantDashboard(userId);

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

exports.getAllTenants = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const tenants = await tenantService.getAllTenants({
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    responseHandler.setSuccess(200, "Tenants retrieved successfully", tenants);
    return responseHandler.send(res);
  } catch (error) {
    console.error(error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.exportTenants = async (req, res) => {
  try {
    const { format } = req.query;
    let tenants = await tenantService.exportTenants();

    if (!tenants.length) {
      responseHandler.setError(404, "No tenant found to export");
      return responseHandler.send(res);
    }

    tenants = tenants.map((tenant, index) => ({
      "S/N": index + 1,
      Name: `${tenant.firstName} ${tenant.lastName}`,
      Email: tenant.email,
      Phone: tenant.phone,
      City: tenant.city,
      Address: tenant.address,
      Postcode: tenant.postcode,
      Country: tenant.country,
    }));

    if (format === "csv") {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(tenants);

      res.header("Content-Type", "text/csv");
      res.attachment("tenants.csv");
      return res.send(csv);
    } else if (format === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      res.header("Content-Disposition", 'attachment; filename="tenants.pdf"');
      res.header("Content-Type", "application/pdf");

      doc.pipe(res);

      doc.fontSize(18).text("Tenants List", { align: "center" });
      doc.moveDown();

      const headers = Object.keys(tenants[0]);

      doc
        .fontSize(12)
        .fillColor("black")
        .text(headers.join(" | "), { underline: true });
      doc.moveDown();

      tenants.forEach((tenant) => {
        doc.text(Object.values(tenant).join(" | "));
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
    console.error("Error exporting tenants:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getTenantById = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await tenantService.getTenantById(tenantId);

    if (!tenant) {
      responseHandler.setError(404, "Tenant not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      200,
      "Tenant details retrieved successfully",
      tenant
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getTenantTransactions = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const {
      search,
      status,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const transactions = await tenantService.getTenantTransactions({
      tenantId,
      search,
      status,
      startDate,
      endDate,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || "paymentDate",
      sortOrder: sortOrder || "desc",
    });

    responseHandler.setSuccess(
      200,
      "Transaction history retrieved successfully",
      transactions
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.deactivateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const deactivatedTenant = await tenantService.deactivateTenant(tenantId);

    if (!deactivatedTenant) {
      responseHandler.setError(404, "Tenant not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Tenant deactivated successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getCases = async (req, res) => {
  try {
    // Run migration check before query to prevent UUID/STRING errors
    try {
      const { migrateAllUuidMismatches } = require("../models");
      await migrateAllUuidMismatches();
    } catch (migrationError) {
      console.error("⚠️ Migration check failed (non-fatal):", migrationError.message);
      // Continue with query anyway
    }

    const { search, status, urgency, page, limit } = req.query;

    const filters = {
      search: search || "",
      status: status || null,
      urgency: urgency || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    };

    const cases = await tenantService.getTenantCases(req.user.id, filters);

    responseHandler.setSuccess(200, "Cases retrieved successfully", cases);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching cases:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getTenantSettings = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const settings = await tenantService.getTenantSettings(tenantId);

    if (!settings) {
      responseHandler.setError(404, "Tenant not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, settings);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching tenant settings:", error);
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};

exports.updateTenantSettings = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const updateResult = await tenantService.updateTenantSettings(
      tenantId,
      req.body
    );

    if (!updateResult.success) {
      responseHandler.setError(400, updateResult.message);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, updateResult.message);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error updating tenant settings:", error);
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};

exports.getPlatformPricingSettings = async (req, res) => {
  try {
    const { PlatformSettings } = require("../models/index");
    
    let settings = await PlatformSettings.findByPk("PLATFORM_SETTINGS");

    // If settings don't exist, create default settings
    if (!settings) {
      settings = await PlatformSettings.create({
        settingId: "PLATFORM_SETTINGS",
      });
    }

    // Return only pricing-related settings
    const pricingSettings = {
      basePrice: parseFloat(settings.basePrice) || 100.0,
      hasteCaseFee: parseFloat(settings.hasteCaseFee) || 50.0,
    };

    responseHandler.setSuccess(
      200,
      "Platform pricing settings retrieved successfully",
      pricingSettings
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching platform pricing settings:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};
