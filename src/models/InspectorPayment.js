const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const InspectorPayment = sequelize.define(
  "InspectorPayment",
  {
    paymentId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    paymentDate: { type: DataTypes.DATE, allowNull: false },
    paymentAmount: { type: DataTypes.STRING, allowNull: false },
    inspectorId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "InspectorPayment",
    timestamps: true,
  }
);

module.exports = InspectorPayment;
