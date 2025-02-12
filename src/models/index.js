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
const TrackingTime = require("./TrackingTime");

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
User.hasMany(BankDetails, { foreignKey: "userId", as: "inspectorBankDetails" });
User.belongsTo(Expertise, { foreignKey: "expertiseCode", as: "expertise" });
User.hasMany(InspectorPayment, {
  foreignKey: "userId",
  as: "inspectorPayments",
});
User.hasMany(TrackingTime, {
  foreignKey: "userId",
  as: "inspectorTrackingTime",
});

Case.belongsTo(User, { foreignKey: "userId", as: "tenant" });
Case.belongsTo(User, {
  foreignKey: "inspectorId",
  as: "inspector",
  allowNull: true,
});
Case.hasMany(Assessment, { foreignKey: "caseId" });
Case.hasMany(Payment, { foreignKey: "caseId" });
Case.hasMany(CaseTimeline, { foreignKey: "caseId", as: "timeline" });
CaseTimeline.belongsTo(Case, { foreignKey: "caseId" });

Assessment.belongsTo(Case, { foreignKey: "caseId" });
Assessment.belongsTo(User, { foreignKey: "userId", as: "inspector" });

Availability.belongsTo(User, { foreignKey: "userId", as: "inspector" });

BankDetails.belongsTo(User, { foreignKey: "userId", as: "inspector" });

Damage.belongsTo(Property, { foreignKey: "propertyId" });
Damage.belongsTo(Case, { foreignKey: "caseId" });

Expertise.hasMany(User, { foreignKey: "expertiseCode", as: "inspectors" });

InspectorPayment.belongsTo(User, { foreignKey: "userId", as: "inspector" });

Payment.belongsTo(Case, { foreignKey: "caseId" });

Property.hasMany(Damage, { foreignKey: "propertyId" });

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
  TrackingTime,
};
