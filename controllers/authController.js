// ============================================================
// controllers/authController.js — Register, Login, Me
// ============================================================

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const store  = require("../data/store");

// ── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password are required." });
    if (username.trim().length < 3)
      return res.status(400).json({ success: false, message: "Username must be at least 3 characters." });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const existing = await store.getUserByUsername(username.trim());
    if (existing)
      return res.status(409).json({ success: false, message: "Username already taken. Please choose another." });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id:        uuidv4(),
      username:  username.trim(),
      password:  hashedPassword,
      createdAt: new Date().toISOString(),
    };
    await store.createUser(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { id: newUser.id, username: newUser.username, createdAt: newUser.createdAt },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password are required." });

    const user = await store.getUserByUsername(username.trim());
    // Generic message — don't reveal whether username exists
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid username or password." });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ success: false, message: "Invalid username or password." });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN,
        user: { id: user.id, username: user.username },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
};

// ── ME ────────────────────────────────────────────────────────
// GET /api/auth/me  (Protected — called by frontend to verify stored token)
// req.user is populated by authMiddleware before this runs
const me = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Token is valid.",
    data: { id: req.user.id, username: req.user.username },
  });
};

module.exports = { register, login, me };
