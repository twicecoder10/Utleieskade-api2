const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const NotificationSettings = require("./NotificationSettings");
const PrivacyPolicySettings = require("./PrivacyPolicySettings");

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
    userPhone: { type: DataTypes.STRING, allowNull: true },
    userCity: { type: DataTypes.STRING, allowNull: true },
    userPostcode: { type: DataTypes.STRING, allowNull: true },
    userAddress: { type: DataTypes.STRING, allowNull: true },
    userCountry: { type: DataTypes.STRING, allowNull: true },
    userType: {
      type: DataTypes.ENUM(
        "admin",
        "sub-admin",
        "tenant",
        "landlord",
        "inspector"
      ),
      allowNull: false,
    },
    userGender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },
    userProfilePic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userStatus: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    token: { type: DataTypes.STRING, allowNull: true },
    inspectorExpertiseCode: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "User", timestamps: true }
);

User.afterCreate(async (user) => {
  await NotificationSettings.create({
    userId: user.userId,
    deadlineNotifications: true,
    newCaseAlerts: true,
    tenantUpdates: true,
    messageNotifications: true,
  });

  await PrivacyPolicySettings.create({
    userId: user.userId,
    essentialCookies: true,
    thirdPartySharing: true,
  });
});

module.exports = User;
