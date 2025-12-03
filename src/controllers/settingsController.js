const inspectorService = require("../services/inspectorService");
const responseHandler = require("../utils/responseHandler");
const { PlatformSettings, User } = require("../models/index");
const { Op } = require("sequelize");

exports.getBankDetails = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const inspectorsData = await inspectorService.getAllInspectors({
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    responseHandler.setSuccess(
      200,
      "Inspectors retrieved successfully",
      inspectorsData
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

// Platform Settings
exports.getPlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findByPk("PLATFORM_SETTINGS");

    // If settings don't exist, create default settings
    if (!settings) {
      settings = await PlatformSettings.create({
        settingId: "PLATFORM_SETTINGS",
      });
    }

    responseHandler.setSuccess(
      200,
      "Platform settings retrieved successfully",
      settings
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.updatePlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findByPk("PLATFORM_SETTINGS");

    // If settings don't exist, create them
    if (!settings) {
      settings = await PlatformSettings.create({
        settingId: "PLATFORM_SETTINGS",
        ...req.body,
      });
    } else {
      // Update existing settings
      await settings.update(req.body);
    }

    responseHandler.setSuccess(
      200,
      "Platform settings updated successfully",
      settings
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error updating platform settings:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

// Data Deletion
exports.processDataDeletion = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      responseHandler.setError(400, "User ID is required");
      return responseHandler.send(res);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      responseHandler.setError(404, "User not found");
      return responseHandler.send(res);
    }

    // Anonymize user data
    await user.update({
      userFirstName: "Deleted",
      userLastName: "User",
      userEmail: `deleted_${userId}@deleted.local`,
      userPhone: null,
      userAddress: null,
      userCity: null,
      userPostcode: null,
      userCountry: null,
      userProfilePic: null,
    });

    // TODO: Add logic to delete related data (cases, payments, etc.)
    // This should be implemented based on GDPR requirements

    responseHandler.setSuccess(200, "User data deleted successfully");
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error processing data deletion:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

// Data Logs (simplified version - you may want to create a DataLog model)
exports.getDataLogs = async (req, res) => {
  try {
    const { userId, startDate, endDate, actionType, page = 1, limit = 20 } = req.query;

    // For now, return empty logs
    // TODO: Implement proper data logging with a DataLog model
    const logs = [];
    const total = 0;

    responseHandler.setSuccess(200, "Data logs retrieved successfully", {
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching data logs:", error);
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};