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
    trackingTimeStart: { type: DataTypes.TIME, allowNull: false },
    trackingTimeEnd: { type: DataTypes.TIME, allowNull: false },
    inspectorId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "TrackingTime",
    timestamps: true,
  }
);

module.exports = TrackingTime;
