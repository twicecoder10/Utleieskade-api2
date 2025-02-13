const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Refund = sequelize.define(
  "Refund",
  {
    refundId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    caseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    refundStatus: {
      type: DataTypes.ENUM("pending", "processed", "rejected"),
      defaultValue: "pending",
    },
    requestDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Refund",
    timestamps: true,
  }
);

module.exports = Refund;
