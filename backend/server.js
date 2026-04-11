require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/database");

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Initialize Mongoose Connection =====
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

// ===== Routes =====
// Mount authentication routes
app.use("/api/auth", require("./src/routes/authRoutes"));

// Mount analysis routes (protected)
app.use("/api/analysis", require("./src/routes/analysisRoutes"));
app.use("/api/analyses", require("./src/routes/analysisRoutes"));

// Mount documentation routes
app.use("/api/docs", require("./src/routes/docsRoutes"));
app.use("/api/admin/docs", require("./src/routes/docsRoutes"));

// Mount admin routes (protected)
app.use("/api/admin", require("./src/routes/admin"));

// Mount user settings routes (protected)
app.use("/api/users", require("./src/routes/userRoutes"));

// Mount client feedback route (protected)
app.use("/api/feedback", require("./src/routes/feedbackRoutes"));

// ===== Health Check =====
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

// ===== Error Handling Middleware =====
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
