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
    // Use raw SQL to avoid Sequelize model validation issues
    const sequelize = TrackingTime.sequelize;
    const startTime = new Date();
    
    let newTimer;
    let timerId;
    
    // Try to create using raw SQL with different column combinations
    // Handle both TIME and TIMESTAMP/DATE column types
    // trackingTimeEnd should be NULL when starting a timer (it gets set when stopping)
    // Try without caseId first since it may not exist in the database
    const attempts = [
      // Attempt 1: Without caseId and isActive (most compatible - works if columns don't exist)
      `INSERT INTO "TrackingTime" ("trackingId", "inspectorId", "trackingTimeStart", "trackingTimeEnd", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, NOW(), NULL, NOW(), NOW()) RETURNING *`,
      // Attempt 2: With isActive but without caseId
      `INSERT INTO "TrackingTime" ("trackingId", "inspectorId", "trackingTimeStart", "trackingTimeEnd", "isActive", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, NOW(), NULL, $2, NOW(), NOW()) RETURNING *`,
      // Attempt 3: With caseId but without isActive
      `INSERT INTO "TrackingTime" ("trackingId", "caseId", "inspectorId", "trackingTimeStart", "trackingTimeEnd", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, NOW(), NULL, NOW(), NOW()) RETURNING *`,
      // Attempt 4: With both caseId and isActive
      `INSERT INTO "TrackingTime" ("trackingId", "caseId", "inspectorId", "trackingTimeStart", "trackingTimeEnd", "isActive", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, NOW(), NULL, $3, NOW(), NOW()) RETURNING *`,
    ];
    
    const attemptParams = [
      [inspectorId],
      [inspectorId, true],
      [caseId, inspectorId],
      [caseId, inspectorId, true],
    ];
    
    let lastError = null;
    for (let i = 0; i < attempts.length; i++) {
      try {
        console.log(`Attempting to create timer (attempt ${i + 1}/${attempts.length}) with SQL`);
        const [results] = await sequelize.query(attempts[i], {
          bind: attemptParams[i],
          type: sequelize.QueryTypes.INSERT,
        });
        
        // Fetch the created record - results structure may vary
        timerId = results?.[0]?.trackingId || results?.trackingId || (Array.isArray(results) && results.length > 0 ? results[0]?.trackingId : null);
        if (!timerId && results && results.length > 0) {
          // Try to get trackingId from the result
          const firstResult = results[0];
          timerId = firstResult.trackingId || firstResult.trackingid;
        }
        
        if (timerId) {
          newTimer = await TrackingTime.findByPk(timerId);
          if (!newTimer && results && results.length > 0) {
            // If findByPk fails, create a mock object from the raw result
            const rawResult = results[0];
            newTimer = {
              trackingId: rawResult.trackingId || rawResult.trackingid,
              trackingTimeStart: rawResult.trackingTimeStart || rawResult.trackingtimestart || startTime,
              trackingTimeEnd: rawResult.trackingTimeEnd || rawResult.trackingtimeend || null,
              inspectorId: rawResult.inspectorId || rawResult.inspectorid || inspectorId,
              caseId: rawResult.caseId || rawResult.caseid || caseId,
              isActive: rawResult.isActive !== undefined ? rawResult.isActive : (rawResult.isactive !== undefined ? rawResult.isactive : null),
            };
          }
          console.log(`✅ Timer created successfully on attempt ${i + 1}`);
          break;
        }
      } catch (createError) {
        const errorMsg = createError.message || String(createError);
        const hasCaseIdError = errorMsg.includes("caseId") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column") || errorMsg.includes("of relation"));
        const hasIsActiveError = errorMsg.includes("isActive") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column") || errorMsg.includes("of relation"));
        const hasTimeError = errorMsg.includes("time") && (errorMsg.includes("invalid input") || errorMsg.includes("syntax"));
        
        console.warn(`Attempt ${i + 1} failed:`, errorMsg);
        lastError = createError;
        
        // If this is the last attempt, try one more time with minimal fields
        if (i === attempts.length - 1) {
          // Last resort: try with only inspectorId, trackingTimeEnd should be NULL
          try {
            console.log("Trying final fallback with minimal fields");
            const fallbackQueries = [
              // Try with TIMESTAMP/DATE - trackingTimeEnd is NULL when starting
              `INSERT INTO "TrackingTime" ("trackingId", "inspectorId", "trackingTimeStart", "trackingTimeEnd", "createdAt", "updatedAt") 
               VALUES (gen_random_uuid(), $1, NOW(), NULL, NOW(), NOW()) RETURNING *`,
              // Try with TIME (extract time portion) - trackingTimeEnd is NULL when starting
              `INSERT INTO "TrackingTime" ("trackingId", "inspectorId", "trackingTimeStart", "trackingTimeEnd", "createdAt", "updatedAt") 
               VALUES (gen_random_uuid(), $1, CURRENT_TIME, NULL, NOW(), NOW()) RETURNING *`,
            ];
            
            for (const fallbackQuery of fallbackQueries) {
              try {
                const [finalResults] = await sequelize.query(fallbackQuery, {
                  bind: [inspectorId],
                  type: sequelize.QueryTypes.INSERT,
                });
                const finalResult = finalResults?.[0] || finalResults;
                timerId = finalResult?.trackingId || finalResult?.trackingid;
                if (timerId) {
                  newTimer = await TrackingTime.findByPk(timerId);
                  if (!newTimer && finalResult) {
                    newTimer = {
                      trackingId: timerId,
                      trackingTimeStart: finalResult.trackingTimeStart || finalResult.trackingtimestart || startTime,
                      trackingTimeEnd: finalResult.trackingTimeEnd || finalResult.trackingtimeend || null,
                      inspectorId: finalResult.inspectorId || finalResult.inspectorid || inspectorId,
                      caseId: finalResult.caseId || finalResult.caseid || null,
                      isActive: finalResult.isActive !== undefined ? finalResult.isActive : (finalResult.isactive !== undefined ? finalResult.isactive : null),
                    };
                  }
                  console.log(`✅ Timer created successfully with final fallback`);
                  break;
                }
              } catch (fallbackErr) {
                console.warn("Fallback query failed:", fallbackErr.message);
                if (fallbackQuery === fallbackQueries[fallbackQueries.length - 1]) {
                  throw fallbackErr;
                }
              }
            }
            if (newTimer) break;
          } catch (finalError) {
            console.error("Final fallback also failed:", finalError.message);
            throw new Error(`Failed to create timer: ${finalError.message}`);
          }
        }
      }
    }
    
    if (!newTimer) {
      throw new Error(`Failed to create timer after all attempts: ${lastError?.message || 'Unknown error'}`);
    }

    responseHandler.setSuccess(200, "Timer started successfully", {
      timerId: newTimer.trackingId,
      startTime: newTimer.trackingTimeStart,
      isActive: newTimer.isActive !== undefined ? newTimer.isActive : (newTimer.trackingTimeEnd === null), // Reflect isActive based on available data
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

