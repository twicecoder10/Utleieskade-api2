const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssessmentItem = sequelize.define(
  "AssessmentItem",
  {
    itemId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    reportId: { type: DataTypes.UUID, allowNull: false },
    item: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL, allowNull: false },
    hours: { type: DataTypes.INTEGER, allowNull: false },
    hourlyRate: { type: DataTypes.DECIMAL, allowNull: false },
    sumMaterial: { type: DataTypes.DECIMAL, allowNull: false },
    sumWork: { type: DataTypes.DECIMAL, allowNull: false },
    sumPost: { type: DataTypes.DECIMAL, allowNull: false },
  },
  { tableName: "AssessmentItem", timestamps: true }
);

module.exports = AssessmentItem;
