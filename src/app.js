const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/errorMiddleware");
const morgan = require("morgan");
const setupSwagger = require("./config/swagger");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));

const userRoutes = require("./routes/userRoutes");
const caseRoutes = require("./routes/caseRoutes");

app.use("/users", userRoutes);
app.use("/cases", caseRoutes);

app.use(errorMiddleware);

setupSwagger(app);

app.get("/", (req, res) => {
  res.send("Utleieskade Rental Damage API is running...");
});

module.exports = { app };
