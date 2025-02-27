const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PrivacyPolicySettings = sequelize.define(
  "PrivacyPolicySettings",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    essentialCookies: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    thirdPartySharing: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  { tableName: "PrivacyPolicySettings", timestamps: false }
);

module.exports = PrivacyPolicySettings;
