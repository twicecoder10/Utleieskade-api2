/**
 * Log an inspector action to the ActionLog table
 * 
 * This is a convenience wrapper that uses the unified logAction function.
 * For backward compatibility, this module is kept separate, but it now
 * delegates to the unified logging system.
 * 
 * @param {string} inspectorId - The ID of the inspector performing the action
 * @param {string} actionType - Type of action (e.g., 'case_claimed', 'case_cancelled', 'report_submitted')
 * @param {string} actionDescription - Description of the action
 * @param {string} caseId - Optional case ID related to the action
 * @param {object} metadata - Optional metadata about the action
 * @returns {Promise<ActionLog|null>} The created action log entry
 */
const { logInspectorAction: logInspectorActionUnified } = require("./logAction");

const logInspectorAction = logInspectorActionUnified;

module.exports = { logInspectorAction };

