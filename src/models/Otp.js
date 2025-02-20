const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Otp = sequelize.define(
  "Otp",
  {
    otpId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    otpCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "Otp",
    timestamps: true,
  }
);

module.exports = Otp;