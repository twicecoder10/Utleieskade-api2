const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserExpertise = sequelize.define(
  "UserExpertise",
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "User",
        key: "userId",
      },
    },
    expertiseCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Expertise",
        key: "expertiseCode",
      },
    },
  },
  {
    tableName: "UserExpertise",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["userId", "expertiseCode"],
      },
    ],
  }
);

module.exports = UserExpertise;