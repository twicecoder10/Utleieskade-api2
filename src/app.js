const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/errorMiddleware");
const morgan = require("morgan");
const setupSwagger = require("./config/swagger");
const path = require("path");
const socketIO = require("socket.io");
const handleSocketEvents = require("./socket/socketControllers");

const app = express();

// CORS configuration - SIMPLIFIED AND BULLETPROOF
const allowedOrigins = [
  "https://utleieskade-admin.vercel.app",
  "https://utleieskade-inspector.vercel.app",
  "https://utleieskade-tenant.vercel.app",
  "https://utleieskade-landing.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];

// Universal CORS handler - applies to ALL requests - MUST BE FIRST
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log for debugging (remove in production if too verbose)
  if (req.method === "OPTIONS") {
    console.log(`[CORS] OPTIONS request from origin: ${origin}`);
  }
  
  // Set CORS headers for allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
    res.setHeader("Access-Control-Expose-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  
  // Handle preflight OPTIONS requests immediately - BEFORE any routing
  if (req.method === "OPTIONS") {
    console.log(`[CORS] Responding to OPTIONS with 204`);
    return res.status(204).end();
  }
  
  next();
});

// Additional CORS middleware using cors package
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  exposedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

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
const settingsRoutes = require("./routes/settingsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const actionLogRoutes = require("./routes/actionLogRoutes");
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
app.use("/settings", settingsRoutes);
app.use("/notifications", notificationRoutes);
app.use("/action-logs", actionLogRoutes);

app.use(errorMiddleware);

setupSwagger(app);

// Test endpoint to verify CORS is working
app.get("/test-cors", (req, res) => {
  const origin = req.headers.origin;
  res.json({
    message: "CORS test endpoint",
    origin: origin,
    allowed: allowedOrigins.includes(origin || ""),
    timestamp: new Date().toISOString(),
    version: "dcc46a8-simplified-cors"
  });
});

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
