const { ActionLog } = require("../models/index");

/**
 * Log an action to the ActionLog table (supports both admin and inspector actions)
 * @param {object} params - Action log parameters
 * @param {string} [params.inspectorId] - The ID of the inspector performing the action (required if adminId not provided)
 * @param {string} [params.adminId] - The ID of the admin performing the action (required if inspectorId not provided)
 * @param {string} params.actionType - Type of action (e.g., 'case_claimed', 'case_cancelled', 'report_submitted', 'admin_case_assigned', etc.)
 * @param {string} params.actionDescription - Description of the action
 * @param {string} [params.caseId] - Optional case ID related to the action
 * @param {object} [params.metadata] - Optional metadata about the action
 * @returns {Promise<ActionLog|null>} The created action log entry, or null if logging fails
 */
const logAction = async ({ inspectorId, adminId, actionType, actionDescription, caseId = null, metadata = null }) => {
  try {
    // Validate that at least one of inspectorId or adminId is provided
    if (!inspectorId && !adminId) {
      console.warn("⚠️  Cannot log action: either inspectorId or adminId must be provided");
      return null;
    }

    const actionLog = await ActionLog.create({
      inspectorId: inspectorId || null,
      adminId: adminId || null,
      actionType,
      actionDescription,
      caseId,
      metadata,
    });

    const actorId = inspectorId || adminId;
    const actorType = inspectorId ? "inspector" : "admin";
    console.log(`✅ Action logged: ${actionType} for ${actorType} ${actorId}${caseId ? ` on case ${caseId}` : ''}`);
    return actionLog;
  } catch (error) {
    // Don't throw - logging failures shouldn't break the main action
    console.error(`❌ Error logging action:`, error.message);
    const actorId = inspectorId || adminId;
    const actorType = inspectorId ? "inspector" : "admin";
    console.error(`   Action: ${actionType}, ${actorType}: ${actorId}, Case: ${caseId}`);
    return null;
  }
};

/**
 * Log an inspector action (convenience wrapper)
 * @param {string} inspectorId - The ID of the inspector performing the action
 * @param {string} actionType - Type of action
 * @param {string} actionDescription - Description of the action
 * @param {string} [caseId] - Optional case ID related to the action
 * @param {object} [metadata] - Optional metadata about the action
 * @returns {Promise<ActionLog|null>} The created action log entry
 */
const logInspectorAction = async (inspectorId, actionType, actionDescription, caseId = null, metadata = null) => {
  return logAction({
    inspectorId,
    actionType,
    actionDescription,
    caseId,
    metadata,
  });
};

/**
 * Log an admin action (convenience wrapper)
 * @param {string} adminId - The ID of the admin performing the action
 * @param {string} actionType - Type of action
 * @param {string} actionDescription - Description of the action
 * @param {string} [caseId] - Optional case ID related to the action
 * @param {object} [metadata] - Optional metadata about the action
 * @returns {Promise<ActionLog|null>} The created action log entry
 */
const logAdminAction = async (adminId, actionType, actionDescription, caseId = null, metadata = null) => {
  return logAction({
    adminId,
    actionType,
    actionDescription,
    caseId,
    metadata,
  });
};

module.exports = { logAction, logInspectorAction, logAdminAction };

