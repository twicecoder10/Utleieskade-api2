const { ActionLog } = require("../models/index");

/**
 * Log an inspector action to the ActionLog table
 * @param {string} inspectorId - The ID of the inspector performing the action
 * @param {string} actionType - Type of action (e.g., 'case_claimed', 'case_cancelled', 'report_submitted')
 * @param {string} actionDescription - Description of the action
 * @param {string} caseId - Optional case ID related to the action
 * @param {object} metadata - Optional metadata about the action
 * @returns {Promise<ActionLog>} The created action log entry
 */
const logInspectorAction = async (inspectorId, actionType, actionDescription, caseId = null, metadata = null) => {
  try {
    if (!inspectorId) {
      console.warn("⚠️  Cannot log action: inspectorId is missing");
      return null;
    }

    const actionLog = await ActionLog.create({
      inspectorId,
      actionType,
      actionDescription,
      caseId,
      metadata,
    });

    console.log(`✅ Action logged: ${actionType} for inspector ${inspectorId}${caseId ? ` on case ${caseId}` : ''}`);
    return actionLog;
  } catch (error) {
    // Don't throw - logging failures shouldn't break the main action
    console.error(`❌ Error logging inspector action:`, error.message);
    console.error(`   Action: ${actionType}, Inspector: ${inspectorId}, Case: ${caseId}`);
    return null;
  }
};

module.exports = { logInspectorAction };

