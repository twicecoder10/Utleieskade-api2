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
    damageArea: { type: DataTypes.STRING, allowNull: false },
    damagePhotos: { type: DataTypes.JSON, allowNull: false },
    damageDescription: { type: DataTypes.STRING, allowNull: false },
    propertyId: { type: DataTypes.UUID, allowNull: false },
    caseId: { type: DataTypes.UUID, allowNull: false },
  },
  { tableName: "Damage", timestamps: true }
);

module.exports = Damage;
