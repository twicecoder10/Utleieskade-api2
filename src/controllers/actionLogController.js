const responseHandler = require("../utils/responseHandler");
const { ActionLog } = require("../models/index");
const { Op } = require("sequelize");

exports.getActionLogs = async (req, res) => {
  try {
    const {
      actionType,
      startDate,
      endDate,
      caseId,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    // Get inspector ID from authenticated user
    const inspectorId = req.user?.id;
    
    if (!inspectorId) {
      responseHandler.setError(401, "Unauthorized - Inspector ID not found");
      return responseHandler.send(res);
    }

    // Build where clause
    const whereClause = {
      inspectorId,
    };

    if (actionType) {
      whereClause.actionType = actionType;
    }

    if (caseId) {
      whereClause.caseId = caseId;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { actionDescription: { [Op.iLike]: `%${search}%` } },
        { actionType: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch logs with pagination
    const { count, rows: logs } = await ActionLog.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    responseHandler.setSuccess(200, "Action logs retrieved successfully", {
      logs,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error retrieving action logs: ", error);
    responseHandler.setError(500, error.message || "Internal server error!");
    return responseHandler.send(res);
  }
};

exports.getActionTypes = async (req, res) => {
  try {
    // Return inspector-specific action types
    const actionTypes = [
      "case_claimed",
      "case_cancelled",
      "case_on_hold",
      "case_released",
      "case_completed",
      "report_submitted",
      "timer_started",
      "timer_stopped",
    ];

    responseHandler.setSuccess(200, "Action types retrieved successfully", actionTypes);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error retrieving action types: ", error);
    responseHandler.setError(500, error.message || "Internal server error!");
    return responseHandler.send(res);
  }
};

