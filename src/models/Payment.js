const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Payment = sequelize.define(
  "Payment",
  {
    paymentId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    caseId: { type: DataTypes.UUID, allowNull: false },
    paymentAmount: { type: DataTypes.STRING, allowNull: false },
    paymentDate: { type: DataTypes.DATE, allowNull: false },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "failed", "completed"),
      allowNull: false,
    },
    paymentDescription: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "Payment", timestamps: true }
);

module.exports = Payment;
