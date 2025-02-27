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
    userId: { type: DataTypes.UUID, allowNull: false },
    inspectorId: { type: DataTypes.UUID, allowNull: true },
    propertyId: { type: DataTypes.UUID, allowNull: false },
    buildingNumber: { type: DataTypes.STRING, allowNull: true },
    caseStatus: {
      type: DataTypes.ENUM("open", "closed", "cancelled"),
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
