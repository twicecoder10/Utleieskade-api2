const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

const InspectorPayment = sequelize.define(
  "InspectorPayment",
  {
    paymentId: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => generateUniqueId("PAYE"),
    },
    paymentDate: { type: DataTypes.DATE, allowNull: false },
    paymentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    inspectorId: { type: DataTypes.STRING, allowNull: false },
    caseId: { type: DataTypes.STRING, allowNull: true, comment: "Case ID this payment is associated with" },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "processed", "rejected", "requested"),
      defaultValue: "pending",
      allowNull: false,
    },
    rejectionReason: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "InspectorPayment",
    timestamps: true,
  }
);

module.exports = InspectorPayment;
