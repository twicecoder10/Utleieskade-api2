const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DamagePhoto = sequelize.define(
  "DamagePhoto",
  {
    photoId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    damageId: { type: DataTypes.UUID, allowNull: false },
    photoType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photoUrl: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "DamagePhoto", timestamps: true }
);

module.exports = DamagePhoto;
