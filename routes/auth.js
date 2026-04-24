// ============================================================
// routes/auth.js — Authentication Routes
// ============================================================

const express       = require("express");
const router        = express.Router();
const authMiddleware = require("../middleware/auth");
const { register, login, me } = require("../controllers/authController");

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me  — Protected: verifies current token (used by frontend on page load)
// FIX: authMiddleware was missing here in the original — caused /me to always 500
router.get("/me", authMiddleware, me);

module.exports = router;