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
      inspectorId: queryInspectorId,
      adminId: queryAdminId,
      userId, // For backward compatibility, can be inspectorId or adminId
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const userType = req.user?.userType;
    const userIdFromAuth = req.user?.id;

    // Build where clause
    const whereClause = {};

    // Filter by user type: admins can see all logs, inspectors/admins can see their own
    if (userType === "admin" || userType === "sub-admin") {
      // Admins can filter by inspectorId or adminId from query params
      if (queryInspectorId) {
        whereClause.inspectorId = queryInspectorId;
      }
      if (queryAdminId) {
        whereClause.adminId = queryAdminId;
      }
      // If userId is provided, check if it matches an inspector or admin
      if (userId && !queryInspectorId && !queryAdminId) {
        whereClause[Op.or] = [
          { inspectorId: userId },
          { adminId: userId },
        ];
      }
      // If no filters, show all logs for admins
    } else if (userType === "inspector") {
      // Inspectors can only see their own logs
      whereClause.inspectorId = userIdFromAuth;
    } else {
      responseHandler.setError(403, "Forbidden - Insufficient permissions");
      return responseHandler.send(res);
    }

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
      // If we already have an Op.or (from userId filter), merge it
      const searchOr = [
        { actionDescription: { [Op.iLike]: `%${search}%` } },
        { actionType: { [Op.iLike]: `%${search}%` } },
      ];
      
      if (whereClause[Op.or]) {
        // Merge with existing Op.or
        whereClause[Op.and] = [
          { [Op.or]: whereClause[Op.or] },
          { [Op.or]: searchOr },
        ];
        delete whereClause[Op.or];
      } else {
        whereClause[Op.or] = searchOr;
      }
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
    // Return all action types (both inspector and admin)
    const actionTypes = [
      // Inspector actions
      "case_claimed",
      "case_cancelled",
      "case_on_hold",
      "case_released",
      "case_completed",
      "report_submitted",
      "timer_started",
      "timer_stopped",
      // Admin actions
      "admin_case_assigned",
      "admin_case_updated",
      "admin_user_created",
      "admin_user_updated",
      "admin_user_deleted",
      "admin_payment_processed",
      "admin_refund_processed",
    ];

    responseHandler.setSuccess(200, "Action types retrieved successfully", actionTypes);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error retrieving action types: ", error);
    responseHandler.setError(500, error.message || "Internal server error!");
    return responseHandler.send(res);
  }
};

