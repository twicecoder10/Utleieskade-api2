const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Conversation = sequelize.define("Conversation", {
  conversationId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userOne: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userTwo: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lastMessage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastMessageTimestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "Conversations",
  timestamps: true,
});

module.exports = Conversation;