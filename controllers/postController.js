// ============================================================
// controllers/postController.js — Blog Post CRUD
// ============================================================

const { v4: uuidv4 } = require("uuid");
const store = require("../data/store");

// POST /api/posts  (Protected)
const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: "Post title is required." });
    if (!content || !content.trim())
      return res.status(400).json({ success: false, message: "Post content is required." });

    const newPost = {
      id:             uuidv4(),
      title:          title.trim(),
      content:        content.trim(),
      authorId:       req.user.id,
      authorUsername: req.user.username,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    };

    await store.createPost(newPost);
    return res.status(201).json({ success: true, message: "Post created successfully.", data: newPost });
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ success: false, message: "Server error while creating post." });
  }
};

// GET /api/posts  (Public)
const getAllPosts = async (req, res) => {
  try {
    const posts = await store.getAllPosts();
    return res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    console.error("Get all posts error:", err);
    return res.status(500).json({ success: false, message: "Server error while fetching posts." });
  }
};

// GET /api/posts/:id  (Public)
const getPostById = async (req, res) => {
  try {
    const post = await store.getPostById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: `Post with ID "${req.params.id}" not found.` });
    return res.status(200).json({ success: true, data: post });
  } catch (err) {
    console.error("Get post error:", err);
    return res.status(500).json({ success: false, message: "Server error while fetching post." });
  }
};

// PUT /api/posts/:id  (Protected — owner only)
const updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content)
      return res.status(400).json({ success: false, message: "Provide at least one field to update: title or content." });
    if (title !== undefined && !title.trim())
      return res.status(400).json({ success: false, message: "Title cannot be empty." });
    if (content !== undefined && !content.trim())
      return res.status(400).json({ success: false, message: "Content cannot be empty." });

    const post = await store.getPostById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: `Post with ID "${req.params.id}" not found.` });

    // Only the author may update
    if (post.authorId !== req.user.id)
      return res.status(403).json({ success: false, message: "Forbidden. You can only update your own posts." });

    const updatedPost = {
      ...post,
      title:     title   ? title.trim()   : post.title,
      content:   content ? content.trim() : post.content,
      updatedAt: new Date().toISOString(),
    };

    await store.updatePost(updatedPost);
    return res.status(200).json({ success: true, message: "Post updated successfully.", data: updatedPost });
  } catch (err) {
    console.error("Update post error:", err);
    return res.status(500).json({ success: false, message: "Server error while updating post." });
  }
};

// DELETE /api/posts/:id  (Protected — owner only)
const deletePost = async (req, res) => {
  try {
    const post = await store.getPostById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: `Post with ID "${req.params.id}" not found.` });

    if (post.authorId !== req.user.id)
      return res.status(403).json({ success: false, message: "Forbidden. You can only delete your own posts." });

    await store.deletePost(req.params.id);
    return res.status(200).json({ success: true, message: "Post deleted successfully.", data: { id: req.params.id } });
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ success: false, message: "Server error while deleting post." });
  }
};

module.exports = { createPost, getAllPosts, getPostById, updatePost, deletePost };
