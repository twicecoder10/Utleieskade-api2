const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const NotificationSettings = sequelize.define(
  "NotificationSettings",
  {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    deadlineNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    newCaseAlerts: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tenantsUpdates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    messageNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  { tableName: "NotificationSettings", timestamps: false }
);

module.exports = NotificationSettings;
