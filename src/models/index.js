const sequelize = require("../config/db");

const User = require("./User");
const Case = require("./Case");
const CaseTimeline = require("./CaseTimeline");
const Damage = require("./Damage");
const Payment = require("./Payment");
const Assessment = require("./Assessment");
const Availability = require("./Availability");
const BankDetails = require("./BankDetails");
const Expertise = require("./Expertise");
const InspectorPayment = require("./InspectorPayment");
const Property = require("./Property");
const Refund = require("./Refund");
const TrackingTime = require("./TrackingTime");
const Otp = require("./Otp");
const DamagePhoto = require("./DamagePhoto");

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ alter: true, force });
  } catch (err) {
    throw err;
  }
};

User.hasMany(Case, { foreignKey: "userId" });
User.hasMany(Case, { foreignKey: "inspectorId", as: "inspectedCases" });
User.hasMany(Assessment, { foreignKey: "userId", as: "inspectorAssessments" });
User.hasMany(Availability, {
  foreignKey: "userId",
  as: "inspectorAvailability",
});
User.belongsTo(Expertise, { foreignKey: "expertiseCode", as: "expertise" });
User.hasMany(InspectorPayment, {
  foreignKey: "userId",
  as: "inspectorPayments",
});
User.hasMany(TrackingTime, {
  foreignKey: "userId",
  as: "inspectorTrackingTime",
});
User.hasOne(BankDetails, { foreignKey: "userId", as: "bankDetails" });

Case.belongsTo(User, { foreignKey: "userId", as: "tenant" });
Case.belongsTo(User, {
  foreignKey: "inspectorId",
  as: "inspector",
  allowNull: true,
});
Case.belongsTo(Property, { foreignKey: "propertyId", as: "property" });
Case.hasMany(Damage, { foreignKey: "caseId", as: "damages" });
Case.hasMany(Assessment, { foreignKey: "caseId" });
Case.hasMany(Payment, { foreignKey: "caseId" });
Case.hasMany(CaseTimeline, { foreignKey: "caseId", as: "timeline" });
Case.hasOne(Refund, { foreignKey: "caseId", as: "refund" });

CaseTimeline.belongsTo(Case, { foreignKey: "caseId" });

Assessment.belongsTo(Case, { foreignKey: "caseId" });
Assessment.belongsTo(User, { foreignKey: "userId", as: "inspector" });

Availability.belongsTo(User, { foreignKey: "userId", as: "inspector" });

BankDetails.belongsTo(User, {
  foreignKey: "userId",
  as: "inspector",
});

Damage.belongsTo(Case, { foreignKey: "caseId" });
Damage.hasMany(DamagePhoto, { foreignKey: "damageId", as: "damagePhotos" });

Expertise.hasMany(User, { foreignKey: "expertiseCode", as: "inspectors" });

InspectorPayment.belongsTo(User, {
  foreignKey: "inspectorId",
  as: "inspector",
});
InspectorPayment.belongsTo(BankDetails, {
  foreignKey: "inspectorId",
  targetKey: "userId",
  as: "bankDetails",
});

Payment.belongsTo(Case, { foreignKey: "caseId" });

Property.hasMany(Case, { foreignKey: "propertyId", as: "cases" });

Refund.belongsTo(Case, { foreignKey: "caseId", as: "caseDetails" });

TrackingTime.belongsTo(User, { foreignKey: "userId", as: "inspector" });

module.exports = {
  sequelize,
  syncDatabase,
  User,
  Case,
  CaseTimeline,
  Damage,
  Payment,
  Assessment,
  Availability,
  BankDetails,
  Expertise,
  InspectorPayment,
  Property,
  Refund,
  TrackingTime,
  Otp,
  DamagePhoto,
};
