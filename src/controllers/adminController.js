const userService = require("../services/userService");
const adminService = require("../services/adminService");
const responseHandler = require("../utils/responseHandler");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/generateToken");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

exports.createAdmin = async (req, res) => {
  try {
    const {
      userFirstName,
      userLastName,
      userEmail,
      userPhone,
      userCity,
      userPostcode,
      userAddress,
      userCountry,
      userPassword,
    } = req.body;

    const hashedPassword = await bcrypt.hash(userPassword.trim(), 10);

    const userData = {
      userId: generateUniqueId("ADMIN"),
      userFirstName: userFirstName.trim(),
      userLastName: userLastName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userPhone: userPhone.trim(),
      userCity: userCity.trim(),
      userPostcode: userPostcode.trim(),
      userAddress: userAddress.trim(),
      userCountry: userCountry.trim(),
      userType: "admin",
      userPassword: hashedPassword,
      isVerified: true,
    };

    const newUser = await userService.createUser(userData);

    const token = generateToken(newUser.userId, "7d", newUser.userType);
    responseHandler.setSuccess(201, "Admin created successfully", {
      token,
      userType: newUser.userType,
    });

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

exports.addSubAdmin = async (req, res) => {
  try {
    const { userFirstName, userLastName, userEmail, userPassword } = req.body;

    const hashedPassword = await bcrypt.hash(userPassword.trim(), 10);

    const userData = {
      userId: generateUniqueId("ADMIN"),
      userFirstName: userFirstName.trim(),
      userLastName: userLastName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userType: "sub-admin",
      userPassword: hashedPassword,
      isVerified: true,
    };

    const newUser = await userService.createUser(userData);

    responseHandler.setSuccess(201, "Admin added successfully", {
      userId: newUser.userId,
      userType: newUser.userType,
      firstName: newUser.userFirstName,
      lastName: newUser.userLastName,
      email: newUser.userEmail,
    });

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

exports.getAdminDashboard = async (req, res) => {
  try {
    const dashboardData = await adminService.getAdminDashboardData(req.user.id);
    responseHandler.setSuccess(
      200,
      "Admin dashboard data retrieved successfully",
      dashboardData
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
  const admins = await adminService.getAllAdmins({
    ...req.query,
    reqUserId: req.user?.id,
  });
    responseHandler.setSuccess(200, "Admins retrieved successfully", admins);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const admin = await adminService.getAdminById(req.params.adminId);
    if (!admin) {
      responseHandler.setError(404, "Admin not found");
      return responseHandler.send(res);
    }
    responseHandler.setSuccess(200, "Admin details retrieved", admin);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const updatedAdmin = await adminService.updateAdmin(
      req.params.adminId,
      req.body
    );
    if (!req.body) {
      responseHandler.setError(400, "Update cannot be empty");
      return responseHandler.send(res);
    }
    if (!updatedAdmin) {
      responseHandler.setError(404, "Admin not found");
      return responseHandler.send(res);
    }
    responseHandler.setSuccess(200, "Admin updated successfully", updatedAdmin);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const deletedAdmin = await adminService.deleteAdmin(req.params.adminId);
    if (!deletedAdmin) {
      responseHandler.setError(404, "Admin not found");
      return responseHandler.send(res);
    }
    responseHandler.setSuccess(200, "Admin deleted successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.exportDashboardReport = async (req, res) => {
  try {
    const dashboardData = await adminService.getAdminDashboardData();
    delete dashboardData["overviewGraphs"];

    const keyMap = {
      totalUsers: "Total Users",
      totalInspectors: "Total Inspectors",
      totalTenants: "Total Tenants",
      totalLandlords: "Total Landlords",
      totalRevenue: "Total Revenue",
      totalPayouts: "Total Payouts",
      totalRefunds: "Total Refunds",
      totalCases: "Total Cases",
      totalCompleted: "Total Completed Cases",
      totalCancelled: "Total Cancelled Cases",
    };

    let formattedDashboardData = {};
    Object.keys(dashboardData).forEach((key) => {
      const newKey = keyMap[key] || key;
      formattedDashboardData[newKey] = dashboardData[key] || "N/A";
    });

    const { format } = req.query;

    if (format === "csv") {
      const csvData = adminService.generateDashboardCSV(formattedDashboardData);
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=dashboard_report.csv"
      );
      res.setHeader("Content-Type", "text/csv");
      return res.status(200).send(csvData);
    }

    if (format === "pdf") {
      await adminService.generateDashboardPDF(formattedDashboardData, res);

      return;
    }

    responseHandler.setError(
      400,
      "Invalid format. Use ?format=csv or ?format=pdf"
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error exporting dashboard report:", error);
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};
