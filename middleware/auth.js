// ============================================================
// middleware/auth.js — JWT Authentication Middleware
// ============================================================

const jwt   = require("jsonwebtoken");
const store = require("../data/store");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided. Use: Authorization: Bearer <token>",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await store.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is valid but user no longer exists.",
      });
    }

    req.user = { id: user.id, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message:
        err.name === "TokenExpiredError"
          ? "Token has expired. Please login again."
          : "Invalid token.",
    });
  }
};

module.exports = authMiddleware;