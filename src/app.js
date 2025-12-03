const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/errorMiddleware");
const morgan = require("morgan");
const setupSwagger = require("./config/swagger");
const path = require("path");
const socketIO = require("socket.io");
const handleSocketEvents = require("./socket/socketControllers");

const app = express();

app.use(
  cors({
    origin: [
      "https://utleieskade-admin.vercel.app",
      "https://utleieskade-inspector.vercel.app",
      "https://utleieskade-tenant.vercel.app",
      "https://utleieskade-landing.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const caseRoutes = require("./routes/caseRoutes");
const inspectorRoutes = require("./routes/inspectorRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const refundRoutes = require("./routes/refundRoutes");
const otpRoutes = require("./routes/otpRoutes");
const fileRoutes = require("./routes/fileRoutes");
const chatRoutes = require("./routes/chatRoutes");
const expertiseRoutes = require("./routes/expertiseRoutes");
const { socketAuth } = require("./middlewares/socketAuth");

app.use("/admins", adminRoutes);
app.use("/users", userRoutes);
app.use("/cases", caseRoutes);
app.use("/inspectors", inspectorRoutes);
app.use("/tenants", tenantRoutes);
app.use("/payments", paymentsRoutes);
app.use("/refunds", refundRoutes);
app.use("/otp", otpRoutes);
app.use("/files", fileRoutes);
app.use("/chats", chatRoutes);
app.use("/expertises", expertiseRoutes);

app.use(errorMiddleware);

setupSwagger(app);

app.get("/", (req, res) => {
  res.render("index", {
    apiTitle: "Utleieskade Rental Damage API",
    apiVersion: "1.0.0",
    documentationUrl: "/api-docs",
  });
});

const socketIOSetup = (server) => {
  const io = socketIO(server, { cors: { origin: "*" } });

  io.use(socketAuth);
  handleSocketEvents(io);

  if (server && server.address() && server.address().port) {
    const serverPort = server.address().port;
    console.log(`SocketIO server is running on http://localhost:${serverPort}`);
    return io;
  } else {
    console.log("Server or port is not defined for SocketIO");
  }
};

module.exports = { app, socketIOSetup };
