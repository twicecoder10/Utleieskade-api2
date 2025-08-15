const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");
const Payment = sequelize.define(
  "Payment",
  {
    paymentId: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => generateUniqueId("PAYE"),
    },
    caseId: { type: DataTypes.STRING, allowNull: false },
    paymentAmount: { type: DataTypes.STRING, allowNull: false },
    paymentDate: { type: DataTypes.DATE, allowNull: false },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "processed", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    paymentDescription: { type: DataTypes.STRING, allowNull: false },
    rejectionReason: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "Payment", timestamps: true }
);

module.exports = Payment;
