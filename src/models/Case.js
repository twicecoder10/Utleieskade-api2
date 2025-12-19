const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Case = sequelize.define(
  "Case",
  {
    caseId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    caseCompletedDate: { type: DataTypes.DATE, allowNull: true },
    caseDeadline: { type: DataTypes.DATE, allowNull: true },
    userId: { type: DataTypes.STRING, allowNull: false },
    inspectorId: { type: DataTypes.STRING, allowNull: true },
    propertyId: { type: DataTypes.STRING, allowNull: false },
    buildingNumber: { type: DataTypes.STRING, allowNull: true },
    caseStatus: {
      type: DataTypes.ENUM(
        "open",
        "completed",
        "cancelled",
        "on-hold",
        "pending",
        "in-progress"
      ),
      defaultValue: "open",
    },
    caseUrgencyLevel: {
      type: DataTypes.ENUM("high", "moderate", "low"),
      allowNull: false,
    },
    caseDescription: { type: DataTypes.STRING, allowNull: false },
    cancellationReason: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "Case", timestamps: true }
);

module.exports = Case;
