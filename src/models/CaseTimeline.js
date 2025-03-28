const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CaseTimeline = sequelize.define(
  "CaseTimeline",
  {
    timelineId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    caseId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventType: {
      type: DataTypes.ENUM(
        "caseCreated",
        "inspectorAssigned",
        "inspectorAccepted",
        "siteVisitScheduled",
        "issueRaised",
        "other",
        "caseCompleted",
        "caseCancelled",
        "deadlineExtended",
        "statusChange"
      ),
      allowNull: false,
    },
    eventDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { tableName: "CaseTimeline", timestamps: false }
);

module.exports = CaseTimeline;
