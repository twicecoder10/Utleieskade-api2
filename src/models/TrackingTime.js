const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TrackingTime = sequelize.define(
  "TrackingTime",
  {
    trackingId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    caseId: { type: DataTypes.STRING, allowNull: true },
    trackingTimeStart: { type: DataTypes.DATE, allowNull: true },
    trackingTimeEnd: { type: DataTypes.DATE, allowNull: true },
    inspectorId: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "TrackingTime",
    timestamps: true,
  }
);

module.exports = TrackingTime;
