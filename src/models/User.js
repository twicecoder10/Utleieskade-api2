const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userFirstName: { type: DataTypes.STRING, allowNull: false },
    userLastName: { type: DataTypes.STRING, allowNull: false },
    userPassword: { type: DataTypes.STRING, allowNull: false },
    userEmail: { type: DataTypes.STRING, allowNull: false, unique: true },
    userPhone: { type: DataTypes.STRING, allowNull: false },
    userCity: { type: DataTypes.STRING, allowNull: false },
    userPostcode: { type: DataTypes.STRING, allowNull: false },
    userAddress: { type: DataTypes.STRING, allowNull: false },
    userCountry: { type: DataTypes.STRING, allowNull: false },
    userType: {
      type: DataTypes.ENUM("admin", "tenant", "landlord", "inspector"),
      allowNull: false,
    },
    inspectorStatus: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: true,
    },
    inspectorExpertiseCode: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "User", timestamps: true }
);

module.exports = User;
