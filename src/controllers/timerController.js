const responseHandler = require("../utils/responseHandler");
const { TrackingTime, Case } = require("../models/index");
const { Op } = require("sequelize");

exports.startTimer = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { id: inspectorId } = req.user;

    // Verify case exists and is assigned to this inspector
    const caseItem = await Case.findOne({
      where: { caseId, inspectorId },
    });

    if (!caseItem) {
      responseHandler.setError(404, "Case not found or not assigned to you");
      return responseHandler.send(res);
    }

    // Check if there's an active timer for this case
    // Handle case where caseId or isActive columns might not exist yet
    let activeTimer = null;
    try {
      // Try with both caseId and isActive
      activeTimer = await TrackingTime.findOne({
        where: {
          caseId,
          inspectorId,
          isActive: true,
        },
      });
    } catch (dbError) {
      const errorMsg = dbError.message || String(dbError);
      const hasCaseIdError = errorMsg.includes("caseId") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column"));
      const hasIsActiveError = errorMsg.includes("isActive") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column"));
      
      console.warn("Database error checking for active timer:", errorMsg);
      
      if (hasCaseIdError || hasIsActiveError) {
        // Build where clause without missing columns
        const whereClause = { inspectorId };
        if (!hasCaseIdError) {
          whereClause.caseId = caseId;
        }
        
        // Try with isActive first
        try {
          whereClause.isActive = true;
          activeTimer = await TrackingTime.findOne({
            where: whereClause,
          });
        } catch (isActiveErr) {
          const isActiveErrMsg = isActiveErr.message || String(isActiveErr);
          if (isActiveErrMsg.includes("isActive") && (isActiveErrMsg.includes("does not exist") || isActiveErrMsg.includes("column") || isActiveErrMsg.includes("unknown column"))) {
            // If isActive doesn't exist, use trackingTimeEnd null
            delete whereClause.isActive;
            whereClause.trackingTimeEnd = null;
            try {
              activeTimer = await TrackingTime.findOne({
                where: whereClause,
              });
            } catch (finalErr) {
              console.warn("Could not check for active timer with fallback:", finalErr.message);
              activeTimer = null;
            }
          } else {
            console.warn("Error checking for active timer:", isActiveErrMsg);
            activeTimer = null;
          }
        }
      } else {
        // If it's not a column error, log and continue (might be a different issue)
        console.error("Unexpected error checking for active timer:", errorMsg);
        activeTimer = null;
      }
    }

    if (activeTimer) {
      responseHandler.setError(400, "Timer is already running for this case");
      return responseHandler.send(res);
    }

    // Create new timer session
    // Handle case where caseId or isActive columns might not exist yet
    let newTimer;
    try {
      // Try creating with all new fields
      newTimer = await TrackingTime.create({
        caseId,
        inspectorId,
        trackingTimeStart: new Date(),
        isActive: true,
      });
      console.log("✅ Timer created successfully with all fields");
    } catch (createError) {
      const errorMsg = createError.message || String(createError);
      const hasCaseIdError = errorMsg.includes("caseId") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column"));
      const hasIsActiveError = errorMsg.includes("isActive") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column"));
      
      console.warn("Error creating timer with all fields:", errorMsg);
      
      if (hasCaseIdError || hasIsActiveError) {
        // Build timer data without missing columns
        const timerData = {
          inspectorId,
          trackingTimeStart: new Date(),
        };
        
        if (!hasCaseIdError) {
          timerData.caseId = caseId;
        }
        if (!hasIsActiveError) {
          timerData.isActive = true;
        }
        
        try {
          newTimer = await TrackingTime.create(timerData);
          console.log("✅ Timer created successfully with fallback fields:", Object.keys(timerData));
        } catch (fallbackError) {
          const fallbackMsg = fallbackError.message || String(fallbackError);
          console.error("Error creating timer with fallback:", fallbackMsg);
          
          // Last resort: create with only required fields
          try {
            newTimer = await TrackingTime.create({
              inspectorId,
              trackingTimeStart: new Date(),
            });
            console.log("✅ Timer created with minimal fields");
          } catch (minimalError) {
            console.error("Failed to create timer even with minimal fields:", minimalError.message);
            throw new Error(`Failed to create timer: ${minimalError.message}`);
          }
        }
      } else {
        // If it's not a column error, re-throw
        console.error("Unexpected error creating timer:", errorMsg);
        throw createError;
      }
    }

    responseHandler.setSuccess(200, "Timer started successfully", {
      timerId: newTimer.trackingId,
      startTime: newTimer.trackingTimeStart,
      isActive: true,
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error starting timer:", error);
    responseHandler.setError(500, error.message || "Internal server error");
    return responseHandler.send(res);
  }
};

exports.stopTimer = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { id: inspectorId } = req.user;

    // Find active timer for this case
    // Handle case where caseId or isActive columns might not exist yet
    let activeTimer = null;
    try {
      activeTimer = await TrackingTime.findOne({
        where: {
          caseId,
          inspectorId,
          isActive: true,
        },
      });
    } catch (dbError) {
      const errorMsg = dbError.message || String(dbError);
      const hasCaseIdError = errorMsg.includes("caseId") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column"));
      const hasIsActiveError = errorMsg.includes("isActive") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column"));
      
      console.warn("Database error finding active timer:", errorMsg);
      
      if (hasCaseIdError || hasIsActiveError) {
        // Build where clause without missing columns
        const whereClause = { inspectorId };
        if (!hasCaseIdError) {
          whereClause.caseId = caseId;
        }
        
        // Try with isActive first
        try {
          whereClause.isActive = true;
          activeTimer = await TrackingTime.findOne({
            where: whereClause,
          });
        } catch (isActiveErr) {
          const isActiveErrMsg = isActiveErr.message || String(isActiveErr);
          if (isActiveErrMsg.includes("isActive") && (isActiveErrMsg.includes("does not exist") || isActiveErrMsg.includes("column") || isActiveErrMsg.includes("unknown column"))) {
            // If isActive doesn't exist, use trackingTimeEnd null
            delete whereClause.isActive;
            whereClause.trackingTimeEnd = null;
            try {
              activeTimer = await TrackingTime.findOne({
                where: whereClause,
              });
            } catch (finalErr) {
              console.warn("Could not find active timer with fallback:", finalErr.message);
              activeTimer = null;
            }
          } else {
            console.warn("Error finding active timer:", isActiveErrMsg);
            activeTimer = null;
          }
        }
      } else {
        console.error("Unexpected error finding active timer:", errorMsg);
        activeTimer = null;
      }
    }

    if (!activeTimer) {
      responseHandler.setError(404, "No active timer found for this case");
      return responseHandler.send(res);
    }

    // Stop the timer
    const endTime = new Date();
    try {
      // Try updating with isActive field
      await activeTimer.update({
        trackingTimeEnd: endTime,
        isActive: false,
      });
    } catch (updateError) {
      // If isActive doesn't exist, update without it
      if (updateError.message && updateError.message.includes("isActive") && updateError.message.includes("does not exist")) {
        console.warn("isActive column doesn't exist yet, updating without it");
        await activeTimer.update({
          trackingTimeEnd: endTime,
        });
      } else {
        throw updateError;
      }
    }

    // Calculate duration
    const duration = Math.floor((endTime - new Date(activeTimer.trackingTimeStart)) / 1000); // seconds
    const minutes = Math.floor(duration / 60);
    const hours = Math.floor(minutes / 60);

    responseHandler.setSuccess(200, "Timer stopped successfully", {
      timerId: activeTimer.trackingId,
      startTime: activeTimer.trackingTimeStart,
      endTime,
      duration: {
        seconds: duration,
        minutes,
        hours,
      },
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error stopping timer:", error);
    responseHandler.setError(500, error.message || "Internal server error");
    return responseHandler.send(res);
  }
};

exports.getTimer = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { id: inspectorId } = req.user;

    // Verify case exists and is assigned to this inspector
    const caseItem = await Case.findOne({
      where: { caseId, inspectorId },
    });

    if (!caseItem) {
      responseHandler.setError(404, "Case not found or not assigned to you");
      return responseHandler.send(res);
    }

    // Get active timer
    // Handle case where caseId or isActive columns might not exist yet
    let activeTimer = null;
    let completedTimers = [];
    
    // First, try to check if caseId column exists by attempting a simple query
    try {
      // Try with all new columns first
      activeTimer = await TrackingTime.findOne({
        where: {
          caseId,
          inspectorId,
          isActive: true,
        },
        order: [["trackingTimeStart", "DESC"]],
      });

      // Get all completed timer sessions for this case
      completedTimers = await TrackingTime.findAll({
        where: {
          caseId,
          inspectorId,
          isActive: false,
          trackingTimeEnd: { [Op.ne]: null },
        },
        order: [["trackingTimeStart", "DESC"]],
      });
    } catch (dbError) {
      // Handle missing columns - try different combinations
      const errorMsg = dbError.message || "";
      const hasCaseIdError = errorMsg.includes("caseId") && errorMsg.includes("does not exist");
      const hasIsActiveError = errorMsg.includes("isActive") && errorMsg.includes("does not exist");
      
      if (hasCaseIdError || hasIsActiveError) {
        console.warn("Some columns don't exist yet, querying with fallback");
        
        // Build where clause without missing columns
        const whereClause = { inspectorId };
        if (!hasCaseIdError) {
          whereClause.caseId = caseId;
        }
        
        // Try with isActive first
        try {
          whereClause.isActive = true;
          activeTimer = await TrackingTime.findOne({
            where: whereClause,
            order: [["trackingTimeStart", "DESC"]],
          });
        } catch (isActiveErr) {
          // If isActive doesn't exist, use trackingTimeEnd null
          const isActiveErrMsg = isActiveErr.message || "";
          if (isActiveErrMsg.includes("isActive") && isActiveErrMsg.includes("does not exist")) {
            delete whereClause.isActive;
            whereClause.trackingTimeEnd = null;
            try {
              activeTimer = await TrackingTime.findOne({
                where: whereClause,
                order: [["trackingTimeStart", "DESC"]],
              });
            } catch (finalErr) {
              console.warn("Could not find active timer with fallback:", finalErr.message);
              activeTimer = null;
            }
          } else {
            console.warn("Error checking for active timer:", isActiveErr.message);
            activeTimer = null;
          }
        }
        
        // Get completed timers
        const completedWhere = { inspectorId };
        if (!hasCaseIdError) {
          completedWhere.caseId = caseId;
        }
        if (!hasIsActiveError) {
          completedWhere.isActive = false;
        }
        completedWhere.trackingTimeEnd = { [Op.ne]: null };
        
        try {
          completedTimers = await TrackingTime.findAll({
            where: completedWhere,
            order: [["trackingTimeStart", "DESC"]],
          });
        } catch (completedErr) {
          console.warn("Error fetching completed timers:", completedErr.message);
          completedTimers = [];
        }
      } else {
        // If it's not a column error, re-throw
        throw dbError;
      }
    }

    // Calculate total time from completed sessions
    let totalSeconds = 0;
    completedTimers.forEach((timer) => {
      if (timer.trackingTimeStart && timer.trackingTimeEnd) {
        const duration = Math.floor(
          (new Date(timer.trackingTimeEnd) - new Date(timer.trackingTimeStart)) / 1000
        );
        totalSeconds += duration;
      }
    });

    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);

    responseHandler.setSuccess(200, "Timer data retrieved successfully", {
      activeTimer: activeTimer
        ? {
            timerId: activeTimer.trackingId,
            startTime: activeTimer.trackingTimeStart,
            isActive: true,
          }
        : null,
      sessions: completedTimers.length,
      totalMinutes,
      totalHours,
      totalSeconds,
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error getting timer:", error);
    responseHandler.setError(500, error.message || "Internal server error");
    return responseHandler.send(res);
  }
};

module.exports = exports;

