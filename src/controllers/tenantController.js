const tenantService = require("../services/tenantService");
const responseHandler = require("../utils/responseHandler");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

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
    const transactions = await tenantService.getTenantTransactions(tenantId);

    if (!transactions.length) {
      responseHandler.setError(404, "No transactions found for this tenant");
      return responseHandler.send(res);
    }

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
