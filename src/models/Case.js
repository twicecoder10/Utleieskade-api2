const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Case = sequelize.define(
  "Case",
  {
    caseId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    caseCompletedDate: { type: DataTypes.DATE, allowNull: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    inspectorId: { type: DataTypes.UUID, allowNull: false },
    caseStatus: {
      type: DataTypes.ENUM("open", "closed"),
      defaultValue: "open",
    },
    caseUrgencyLevel: {
      type: DataTypes.ENUM("high", "moderate", "low"),
      allowNull: false,
    },
    caseDescription: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "Case", timestamps: true }
);

module.exports = Case;
