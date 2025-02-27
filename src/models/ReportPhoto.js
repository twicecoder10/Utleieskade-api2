const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ReportPhoto = sequelize.define(
  "ReportPhoto",
  {
    photoId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    reportId: { type: DataTypes.UUID, allowNull: false },
    photoUrl: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "ReportPhoto", timestamps: true }
);

module.exports = ReportPhoto;
