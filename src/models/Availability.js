const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Availability = sequelize.define(
  "Availability",
  {
    availabilityId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    inspectorId: { type: DataTypes.UUID, allowNull: false },
    availabilityDate: { type: DataTypes.DATE, allowNull: false },
    availabilityTime: { type: DataTypes.TIME, allowNull: false },
  },
  { tableName: "Availability", timestamps: false }
);

module.exports = Availability;
