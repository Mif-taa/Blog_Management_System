// ============================================================
// routes/posts.js — Blog Post Routes
// ============================================================

const express        = require("express");
const router         = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createPost, getAllPosts, getPostById, updatePost, deletePost,
} = require("../controllers/postController");

// Public
router.get("/",    getAllPosts);
router.get("/:id", getPostById);

// Protected
router.post("/",    authMiddleware, createPost);
router.put("/:id",  authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);

module.exports = router;
