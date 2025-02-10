const { Sequelize } = require("sequelize");
const { dbPort, dbName, dbUser, dbPassword, dbHost } = require("./env");

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  dialectModule: require("mysql2"),
  logging: false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log(`Connected to ${dbName} database successfully.`);
  })
  .catch((error) => {
    console.error("Unable to connect to database:", error);
  });

module.exports = sequelize;
