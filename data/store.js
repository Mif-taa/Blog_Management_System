// ============================================================
// data/store.js — Dual-mode storage: PostgreSQL or JSON file
//
// HOW IT WORKS:
//   • If DATABASE_URL env var is set → uses PostgreSQL (Render)
//   • If DATABASE_URL is NOT set    → uses local db.json file
//
// This means you get persistence on Render AND easy local dev
// with no database setup required.
// ============================================================

const fs   = require("fs");
const path = require("path");
const { Pool } = require("pg");

// ── JSON File Storage (local dev) ────────────────────────────
const DB_FILE      = path.join(__dirname, "db.json");
const DEFAULT_DATA = { users: [], posts: [] };
let jsonStore      = { ...DEFAULT_DATA };

const loadJsonStore = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    }
    const raw   = fs.readFileSync(DB_FILE, "utf8");
    jsonStore   = JSON.parse(raw || JSON.stringify(DEFAULT_DATA));
    jsonStore.users = Array.isArray(jsonStore.users) ? jsonStore.users : [];
    jsonStore.posts = Array.isArray(jsonStore.posts) ? jsonStore.posts : [];
  } catch (err) {
    console.error("Failed to load JSON store:", err.message);
    jsonStore = { ...DEFAULT_DATA };
  }
};

const saveJsonStore = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(jsonStore, null, 2));
  } catch (err) {
    console.error("Failed to save JSON store:", err.message);
  }
};

// ── PostgreSQL Storage (Render / production) ──────────────────
const usePostgres = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
let pool;

const initPg = async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Render Postgres
  });

  // Test the connection early so any misconfiguration is obvious
  await pool.query("SELECT 1");

  // Create tables if they don't exist yet (idempotent)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      username     TEXT NOT NULL,
      password     TEXT NOT NULL,
      "createdAt"  TEXT NOT NULL
    );
  `);

  // Unique index: prevents duplicate usernames (case-insensitive)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
    ON users (LOWER(username));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id               TEXT PRIMARY KEY,
      title            TEXT NOT NULL,
      content          TEXT NOT NULL,
      "authorId"       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "authorUsername" TEXT NOT NULL,
      "createdAt"      TEXT NOT NULL,
      "updatedAt"      TEXT NOT NULL
    );
  `);

  console.log("✅ PostgreSQL tables ready.");
};

// Kick off DB init immediately so tables exist before first request
const ready = usePostgres
  ? initPg().catch((err) => {
      console.error("❌ PostgreSQL init failed:", err.message);
      process.exit(1); // Stop server — broken DB is worse than no server
    })
  : Promise.resolve(loadJsonStore());

// ── JSON Store API ────────────────────────────────────────────
const jsonApi = {
  getUserByUsername: async (username) =>
    jsonStore.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null,

  getUserById: async (id) =>
    jsonStore.users.find((u) => u.id === id) || null,

  createUser: async (user) => {
    jsonStore.users.push(user);
    saveJsonStore();
    return user;
  },

  getAllPosts: async () =>
    [...jsonStore.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

  getPostById: async (id) =>
    jsonStore.posts.find((p) => p.id === id) || null,

  createPost: async (post) => {
    jsonStore.posts.push(post);
    saveJsonStore();
    return post;
  },

  updatePost: async (post) => {
    const i = jsonStore.posts.findIndex((p) => p.id === post.id);
    if (i !== -1) jsonStore.posts[i] = post;
    saveJsonStore();
    return post;
  },

  deletePost: async (id) => {
    jsonStore.posts = jsonStore.posts.filter((p) => p.id !== id);
    saveJsonStore();
  },
};

// ── PostgreSQL Store API ──────────────────────────────────────
// IMPORTANT: quoted column names (e.g. "createdAt") match the
// CREATE TABLE definitions above. Without quotes Postgres folds
// them to lowercase and the queries would fail.
const pgApi = {
  getUserByUsername: async (username) => {
    await ready;
    const { rows } = await pool.query(
      `SELECT id, username, password, "createdAt"
       FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username]
    );
    return rows[0] || null;
  },

  getUserById: async (id) => {
    await ready;
    const { rows } = await pool.query(
      `SELECT id, username, password, "createdAt" FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  createUser: async (user) => {
    await ready;
    await pool.query(
      `INSERT INTO users (id, username, password, "createdAt")
       VALUES ($1, $2, $3, $4)`,
      [user.id, user.username, user.password, user.createdAt]
    );
    return user;
  },

  getAllPosts: async () => {
    await ready;
    const { rows } = await pool.query(
      `SELECT id, title, content, "authorId", "authorUsername", "createdAt", "updatedAt"
       FROM posts ORDER BY "createdAt" DESC`
    );
    return rows;
  },

  getPostById: async (id) => {
    await ready;
    const { rows } = await pool.query(
      `SELECT id, title, content, "authorId", "authorUsername", "createdAt", "updatedAt"
       FROM posts WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  createPost: async (post) => {
    await ready;
    await pool.query(
      `INSERT INTO posts (id, title, content, "authorId", "authorUsername", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [post.id, post.title, post.content, post.authorId, post.authorUsername, post.createdAt, post.updatedAt]
    );
    return post;
  },

  updatePost: async (post) => {
    await ready;
    await pool.query(
      `UPDATE posts SET title = $1, content = $2, "updatedAt" = $3 WHERE id = $4`,
      [post.title, post.content, post.updatedAt, post.id]
    );
    return post;
  },

  deletePost: async (id) => {
    await ready;
    await pool.query(`DELETE FROM posts WHERE id = $1`, [id]);
  },
};

// Export the correct API based on environment
const store = usePostgres ? pgApi : jsonApi;

console.log(`📦 Storage mode: ${usePostgres ? "PostgreSQL (DATABASE_URL detected)" : "JSON file (db.json)"}`);

module.exports = store;
