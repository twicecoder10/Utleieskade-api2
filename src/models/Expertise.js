const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Expertise = sequelize.define(
  "Expertise",
  {
    expertiseCode: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    expertiseArea: { type: DataTypes.STRING, allowNull: false },
    expertiseDescription: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "Expertise", timestamps: false }
);

module.exports = Expertise;
