const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssessmentSummary = sequelize.define(
  "AssessmentSummary",
  {
    reportId: { type: DataTypes.UUID, allowNull: false },
    totalHours: { type: DataTypes.INTEGER, allowNull: false },
    totalSumMaterials: { type: DataTypes.DECIMAL, allowNull: false },
    totalSumLabor: { type: DataTypes.DECIMAL, allowNull: false },
    sumExclVAT: { type: DataTypes.DECIMAL, allowNull: false },
    vat: { type: DataTypes.DECIMAL, allowNull: false },
    sumInclVAT: { type: DataTypes.DECIMAL, allowNull: false },
    total: { type: DataTypes.DECIMAL, allowNull: false },
  },
  { tableName: "AssessmentSummary", timestamps: true } 
);

module.exports = AssessmentSummary;
