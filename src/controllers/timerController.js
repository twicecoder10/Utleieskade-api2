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
    let activeTimer;
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
      // If caseId column doesn't exist, check without it
      if (dbError.message && dbError.message.includes("caseId") && dbError.message.includes("does not exist")) {
        console.warn("caseId column doesn't exist yet, checking without it");
        try {
          activeTimer = await TrackingTime.findOne({
            where: {
              inspectorId,
              isActive: true,
            },
          });
        } catch (isActiveError) {
          // If isActive also doesn't exist, check for timer without end time
          if (isActiveError.message && isActiveError.message.includes("isActive") && isActiveError.message.includes("does not exist")) {
            console.warn("isActive column doesn't exist yet, checking for timer without end time");
            activeTimer = await TrackingTime.findOne({
              where: {
                inspectorId,
                trackingTimeEnd: null,
              },
            });
          } else {
            throw isActiveError;
          }
        }
      } else if (dbError.message && dbError.message.includes("isActive") && dbError.message.includes("does not exist")) {
        // If only isActive doesn't exist, check without it
        console.warn("isActive column doesn't exist yet, checking for timer without end time");
        try {
          activeTimer = await TrackingTime.findOne({
            where: {
              caseId,
              inspectorId,
              trackingTimeEnd: null,
            },
          });
        } catch (caseIdError) {
          // If caseId also doesn't exist
          if (caseIdError.message && caseIdError.message.includes("caseId") && caseIdError.message.includes("does not exist")) {
            activeTimer = await TrackingTime.findOne({
              where: {
                inspectorId,
                trackingTimeEnd: null,
              },
            });
          } else {
            throw caseIdError;
          }
        }
      } else {
        throw dbError;
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
    } catch (createError) {
      // If caseId doesn't exist, try without it
      if (createError.message && createError.message.includes("caseId") && createError.message.includes("does not exist")) {
        console.warn("caseId column doesn't exist yet, creating without it");
        try {
          newTimer = await TrackingTime.create({
            inspectorId,
            trackingTimeStart: new Date(),
            isActive: true,
          });
        } catch (isActiveError) {
          // If isActive also doesn't exist, create without both
          if (isActiveError.message && isActiveError.message.includes("isActive") && isActiveError.message.includes("does not exist")) {
            console.warn("isActive column doesn't exist yet, creating without it");
            newTimer = await TrackingTime.create({
              inspectorId,
              trackingTimeStart: new Date(),
            });
          } else {
            throw isActiveError;
          }
        }
      } else if (createError.message && createError.message.includes("isActive") && createError.message.includes("does not exist")) {
        // If only isActive doesn't exist
        console.warn("isActive column doesn't exist yet, creating without it");
        try {
          newTimer = await TrackingTime.create({
            caseId,
            inspectorId,
            trackingTimeStart: new Date(),
          });
        } catch (caseIdError) {
          // If caseId also doesn't exist
          if (caseIdError.message && caseIdError.message.includes("caseId") && caseIdError.message.includes("does not exist")) {
            newTimer = await TrackingTime.create({
              inspectorId,
              trackingTimeStart: new Date(),
            });
          } else {
            throw caseIdError;
          }
        }
      } else {
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
    let activeTimer;
    try {
      activeTimer = await TrackingTime.findOne({
        where: {
          caseId,
          inspectorId,
          isActive: true,
        },
      });
    } catch (dbError) {
      // Handle missing columns gracefully
      if (dbError.message && dbError.message.includes("caseId") && dbError.message.includes("does not exist")) {
        console.warn("caseId column doesn't exist yet, checking without it");
        try {
          activeTimer = await TrackingTime.findOne({
            where: {
              inspectorId,
              isActive: true,
            },
          });
        } catch (isActiveError) {
          if (isActiveError.message && isActiveError.message.includes("isActive") && isActiveError.message.includes("does not exist")) {
            console.warn("isActive column doesn't exist yet, checking for timer without end time");
            activeTimer = await TrackingTime.findOne({
              where: {
                inspectorId,
                trackingTimeEnd: null,
              },
            });
          } else {
            throw isActiveError;
          }
        }
      } else if (dbError.message && dbError.message.includes("isActive") && dbError.message.includes("does not exist")) {
        console.warn("isActive column doesn't exist yet, checking for timer without end time");
        try {
          activeTimer = await TrackingTime.findOne({
            where: {
              caseId,
              inspectorId,
              trackingTimeEnd: null,
            },
          });
        } catch (caseIdError) {
          if (caseIdError.message && caseIdError.message.includes("caseId") && caseIdError.message.includes("does not exist")) {
            activeTimer = await TrackingTime.findOne({
              where: {
                inspectorId,
                trackingTimeEnd: null,
              },
            });
          } else {
            throw caseIdError;
          }
        }
      } else {
        throw dbError;
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

