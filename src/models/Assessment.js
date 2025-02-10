const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Assessment = sequelize.define(
  "Assessment",
  {
    assessmentId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    assessmentDate: { type: DataTypes.DATE, allowNull: false },
    inspectorId: { type: DataTypes.UUID, allowNull: false },
    caseId: { type: DataTypes.UUID, allowNull: false },
    assessmentLevel: {
      type: DataTypes.ENUM("medium", "high", "low"),
      allowNull: false,
    },
  },
  { tableName: "Assessment", timestamps: true }
);

module.exports = Assessment;
