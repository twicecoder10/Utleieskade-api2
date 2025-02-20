const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Damage = sequelize.define(
  "Damage",
  {
    damageId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    damageDescription: { type: DataTypes.STRING, allowNull: false },
    damageLocation: { type: DataTypes.STRING, allowNull: false },
    caseId: { type: DataTypes.UUID, allowNull: false },
    damageType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    damageDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { tableName: "Damage", timestamps: true }
);

module.exports = Damage;
