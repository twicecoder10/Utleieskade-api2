const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { generateUniqueId } = require("../utils/uniqueIdGenerator");

const Property = sequelize.define(
  "Property",
  {
    propertyId: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => generateUniqueId("PROP"),
    },
    propertyType: { type: DataTypes.STRING, allowNull: false },
    propertyCity: { type: DataTypes.STRING, allowNull: false },
    propertyAddress: { type: DataTypes.STRING, allowNull: false },
    propertyCountry: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "Property",
    timestamps: true,
  }
);

module.exports = Property;
