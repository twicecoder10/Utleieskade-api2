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
    // Handle case where caseId column might not exist yet
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
      // If column doesn't exist, check without caseId
      if (dbError.message && dbError.message.includes("column") && dbError.message.includes("does not exist")) {
        console.warn("caseId column doesn't exist yet, checking without it");
        activeTimer = await TrackingTime.findOne({
          where: {
            inspectorId,
            isActive: true,
          },
        });
      } else {
        throw dbError;
      }
    }

    if (activeTimer) {
      responseHandler.setError(400, "Timer is already running for this case");
      return responseHandler.send(res);
    }

    // Create new timer session
    // Handle case where caseId column might not exist yet
    let newTimer;
    try {
      newTimer = await TrackingTime.create({
        caseId,
        inspectorId,
        trackingTimeStart: new Date(),
        isActive: true,
      });
    } catch (createError) {
      // If column doesn't exist, create without caseId
      if (createError.message && createError.message.includes("column") && createError.message.includes("does not exist")) {
        console.warn("caseId column doesn't exist yet, creating without it");
        newTimer = await TrackingTime.create({
          inspectorId,
          trackingTimeStart: new Date(),
          isActive: true,
        });
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
    // Handle case where caseId column might not exist yet
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
      // If column doesn't exist, check without caseId
      if (dbError.message && dbError.message.includes("column") && dbError.message.includes("does not exist")) {
        console.warn("caseId column doesn't exist yet, checking without it");
        activeTimer = await TrackingTime.findOne({
          where: {
            inspectorId,
            isActive: true,
          },
        });
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
    await activeTimer.update({
      trackingTimeEnd: endTime,
      isActive: false,
    });

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

    // Get active timer
    // Handle case where caseId column might not exist yet
    let activeTimer;
    let completedTimers;
    
    try {
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
      // If column doesn't exist, query without caseId
      if (dbError.message && dbError.message.includes("column") && dbError.message.includes("does not exist")) {
        console.warn("caseId column doesn't exist yet, querying without it");
        activeTimer = await TrackingTime.findOne({
          where: {
            inspectorId,
            isActive: true,
          },
          order: [["trackingTimeStart", "DESC"]],
        });

        completedTimers = await TrackingTime.findAll({
          where: {
            inspectorId,
            isActive: false,
            trackingTimeEnd: { [Op.ne]: null },
          },
          order: [["trackingTimeStart", "DESC"]],
        });
      } else {
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

