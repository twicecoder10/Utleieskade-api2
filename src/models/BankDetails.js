const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BankDetails = sequelize.define(
  "BankDetails",
  {
    bankDetailsId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    accountNumber: { type: DataTypes.INTEGER, allowNull: false },
    sortCode: { type: DataTypes.INTEGER, allowNull: false },
    bankName: { type: DataTypes.STRING, allowNull: false },
    userFirstName: { type: DataTypes.STRING, allowNull: false },
    userLastName: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  },
  { tableName: "BankDetails", timestamps: true }
);

module.exports = BankDetails;
