const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ActionLog = sequelize.define(
  "ActionLog",
  {
    logId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    inspectorId: {
      type: DataTypes.STRING,
      allowNull: true, // Nullable to support admin-only actions
    },
    actionType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    actionDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    caseId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "ActionLog",
    timestamps: true,
  }
);

module.exports = ActionLog;

