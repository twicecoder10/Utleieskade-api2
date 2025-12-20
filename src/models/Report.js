const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Report = sequelize.define(
  "Report",
  {
    reportId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    inspectorId: { type: DataTypes.STRING, allowNull: false },
    caseId: { type: DataTypes.STRING, allowNull: false },
    reportDescription: { type: DataTypes.STRING, allowNull: false },
    pdfUrl: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "Report", timestamps: true }
);

module.exports = Report;
