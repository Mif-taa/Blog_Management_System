// ============================================================
// server.js — Main Entry Point
// Run: npm install && node server.js
// ============================================================

require("dotenv").config();

const express    = require("express");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ─────────────────────────────────────────
app.use(express.json());

// Serve the frontend from /public
app.use(express.static("public"));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── API Routes ────────────────────────────────────────────────
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "📝 Blog Management API is running!",
    version: "2.0.0",
    endpoints: {
      auth:  { register: "POST /api/auth/register", login: "POST /api/auth/login", me: "GET /api/auth/me" },
      posts: { getAll: "GET /api/posts", getOne: "GET /api/posts/:id", create: "POST /api/posts (🔐)", update: "PUT /api/posts/:id (🔐 owner)", delete: "DELETE /api/posts/:id (🔐 owner)" },
    },
  });
});

app.use("/api/auth",  authRoutes);
app.use("/api/posts", postRoutes);

// ── Frontend fallback: serve index.html for all non-API routes ─
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// ── 404 for unmatched API routes ──────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route "${req.method} ${req.originalUrl}" not found.` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "An unexpected server error occurred." });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║   📝 Blog API running on port ${PORT}         ║`);
  console.log(`║   http://localhost:${PORT}                  ║`);
  console.log("╚══════════════════════════════════════════╝\n");
  console.log("JWT Secret:  ", process.env.JWT_SECRET ? "✅ Loaded" : "❌ MISSING");
  console.log("Storage:     ", process.env.DATABASE_URL && process.env.DATABASE_URL.trim() ? "🐘 PostgreSQL" : "📄 JSON file");
  console.log("");
});

module.exports = app;
