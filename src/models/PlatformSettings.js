const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PlatformSettings = sequelize.define(
  "PlatformSettings",
  {
    settingId: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: "PLATFORM_SETTINGS",
      allowNull: false,
    },
    defaultLanguage: {
      type: DataTypes.ENUM("en", "no", "nb"),
      defaultValue: "en",
      allowNull: false,
    },
    paymentThreshold: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    refundPolicyDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false,
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 100.0,
      allowNull: false,
    },
    hasteCaseFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 50.0,
      allowNull: false,
    },
    hasteCaseDeadlineDays: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
      allowNull: false,
    },
    normalCaseDeadlineDays: {
      type: DataTypes.INTEGER,
      defaultValue: 14,
      allowNull: false,
    },
    gdprEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    dataRetentionDays: {
      type: DataTypes.INTEGER,
      defaultValue: 365,
      allowNull: false,
    },
  },
  { tableName: "PlatformSettings", timestamps: true }
);

module.exports = PlatformSettings;

