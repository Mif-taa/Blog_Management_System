// ============================================================
// public/app.js — Blog Management System Frontend
// ============================================================

class BlogApp {
  constructor() {
    // FIX #1: Do NOT hardcode 'http://localhost:3000'
    // Use a relative path so this works on both localhost AND Render.
    // The browser will automatically resolve /api relative to wherever
    // the page is served from (localhost or your-app.onrender.com).
    this.API_BASE    = "/api";
    this.token       = localStorage.getItem("token");
    this.currentUser = localStorage.getItem("username");
    this.currentPostId = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthStatus(); // verify stored token on every page load
    this.loadPosts();
  }

  setupEventListeners() {
    document.getElementById("login-tab").addEventListener("click",    () => this.switchTab("login"));
    document.getElementById("register-tab").addEventListener("click", () => this.switchTab("register"));
    document.getElementById("login-form").addEventListener("submit",  (e) => this.handleLogin(e));
    document.getElementById("register-form").addEventListener("submit",(e) => this.handleRegister(e));
    document.getElementById("create-post-form").addEventListener("submit", (e) => this.handlePostSubmit(e));
    document.getElementById("cancel-post").addEventListener("click",  () => this.hidePostForm());
    document.getElementById("create-post-btn").addEventListener("click", () => this.showPostForm());
    document.querySelector(".close").addEventListener("click", () => this.closeModal());
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("post-modal")) this.closeModal();
    });
  }

  // ── Auth ──────────────────────────────────────────────────────
  async checkAuthStatus() {
    if (!this.token || !this.currentUser) {
      this.showUnauthenticatedUI();
      return;
    }

    // FIX #2: /me was missing authMiddleware on the server — now fixed.
    // This call verifies the stored token is still valid.
    try {
      const response = await this.fetchWithAuth(`${this.API_BASE}/auth/me`);
      if (response && response.ok) {
        const data = await response.json();
        this.currentUser = data.data.username;
        this.showAuthenticatedUI();
      } else {
        // Token invalid / expired — clear it silently
        this.clearAuth();
        this.showUnauthenticatedUI();
      }
    } catch {
      // Network error — show unauthenticated but don't break the app
      this.showUnauthenticatedUI();
    }
  }

  showAuthenticatedUI() {
    document.getElementById("auth-section").innerHTML = `
      <span>Welcome, ${this.escapeHtml(this.currentUser)}!</span>
      <button class="btn btn-danger" onclick="app.logout()">Logout</button>
    `;
    document.getElementById("auth-forms").classList.add("hidden");
    document.getElementById("create-post-btn").classList.remove("hidden");
  }

  showUnauthenticatedUI() {
    document.getElementById("auth-section").innerHTML = `
      <button class="btn btn-primary" onclick="app.showAuthForms()">Login / Register</button>
    `;
    document.getElementById("auth-forms").classList.add("hidden");
    document.getElementById("create-post-btn").classList.add("hidden");
  }

  showAuthForms() {
    document.getElementById("auth-forms").classList.remove("hidden");
    this.switchTab("login");
  }

  switchTab(tab) {
    const isLogin = tab === "login";
    document.getElementById("login-tab").classList.toggle("active", isLogin);
    document.getElementById("register-tab").classList.toggle("active", !isLogin);
    document.getElementById("login-form").classList.toggle("hidden", !isLogin);
    document.getElementById("register-form").classList.toggle("hidden", isLogin);
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        this.token       = data.data.token;
        this.currentUser = data.data.user.username;
        localStorage.setItem("token",    this.token);
        localStorage.setItem("username", this.currentUser);
        this.showMessage("login-message", "Login successful!", "success");
        this.showAuthenticatedUI();
        this.loadPosts();
        setTimeout(() => document.getElementById("auth-forms").classList.add("hidden"), 1500);
      } else {
        this.showMessage("login-message", data.message || "Login failed", "error");
      }
    } catch {
      this.showMessage("login-message", "Network error. Please try again.", "error");
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    try {
      const response = await fetch(`${this.API_BASE}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        this.showMessage("register-message", "Registered! Please login.", "success");
        setTimeout(() => this.switchTab("login"), 1500);
      } else {
        this.showMessage("register-message", data.message || "Registration failed", "error");
      }
    } catch {
      this.showMessage("register-message", "Network error. Please try again.", "error");
    }
  }

  clearAuth() {
    this.token       = null;
    this.currentUser = null;
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }

  logout() {
    this.clearAuth();
    this.showUnauthenticatedUI();
    this.loadPosts();
  }

  // ── Fetch helpers ─────────────────────────────────────────────
  async fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    if (this.token) options.headers["Authorization"] = `Bearer ${this.token}`;
    try {
      const response = await fetch(url, options);
      if (response.status === 401) {
        this.clearAuth();
        this.showUnauthenticatedUI();
        this.showAuthForms();
        this.showMessage("login-message", "Session expired. Please login again.", "error");
        return null;
      }
      return response;
    } catch (err) {
      console.error("Network error:", err);
      return null;
    }
  }

  // ── Posts ─────────────────────────────────────────────────────
  async loadPosts() {
    const loading = document.getElementById("loading");
    const noPosts = document.getElementById("no-posts");
    loading.classList.remove("hidden");
    noPosts.classList.add("hidden");

    try {
      const response = await fetch(`${this.API_BASE}/posts`);
      if (!response) return;
      const data = await response.json();
      if (response.ok) {
        this.displayPosts(data.data || []);
      } else {
        console.error("Failed to load posts:", data.message);
      }
    } catch (err) {
      console.error("loadPosts network error:", err);
    } finally {
      loading.classList.add("hidden");
    }
  }

  displayPosts(posts) {
    const list = document.getElementById("posts-list");
    if (posts.length === 0) {
      document.getElementById("no-posts").classList.remove("hidden");
      list.innerHTML = "";
      return;
    }
    document.getElementById("no-posts").classList.add("hidden");
    list.innerHTML = posts.map((post) => `
      <div class="post-card">
        <h3 class="post-title" onclick="app.viewPost('${post.id}')">
          ${this.escapeHtml(post.title)}
        </h3>
        <p class="post-content">${this.escapeHtml(post.content)}</p>
        <div class="post-meta">
          By ${this.escapeHtml(post.authorUsername)} • ${new Date(post.createdAt).toLocaleDateString()}
        </div>
        ${this.getPostActions(post)}
      </div>
    `).join("");
  }

  getPostActions(post) {
    if (!this.token) return "";
    if (this.currentUser !== post.authorUsername) return "";
    return `
      <div class="post-actions">
        <button class="btn btn-secondary" onclick="app.editPost('${post.id}')">Edit</button>
        <button class="btn btn-danger"    onclick="app.deletePost('${post.id}')">Delete</button>
      </div>
    `;
  }

  showPostForm(postId = null) {
    this.currentPostId = postId;
    const title = document.getElementById("form-title");
    if (postId) {
      title.textContent = "Edit Post";
      this.loadPostForEdit(postId);
    } else {
      title.textContent = "Create New Post";
      document.getElementById("post-title").value   = "";
      document.getElementById("post-content").value = "";
    }
    const form = document.getElementById("post-form");
    form.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth" });
  }

  hidePostForm() {
    document.getElementById("post-form").classList.add("hidden");
    this.currentPostId = null;
  }

  async loadPostForEdit(postId) {
    const response = await this.fetchWithAuth(`${this.API_BASE}/posts/${postId}`);
    if (!response) return;
    const data = await response.json();
    if (response.ok) {
      document.getElementById("post-title").value   = data.data.title;
      document.getElementById("post-content").value = data.data.content;
    }
  }

  async handlePostSubmit(e) {
    e.preventDefault();
    const title   = document.getElementById("post-title").value.trim();
    const content = document.getElementById("post-content").value.trim();
    const url     = this.currentPostId ? `${this.API_BASE}/posts/${this.currentPostId}` : `${this.API_BASE}/posts`;
    const method  = this.currentPostId ? "PUT" : "POST";

    const response = await this.fetchWithAuth(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ title, content }),
    });
    if (!response) return;
    const data = await response.json();
    if (response.ok) {
      this.showMessage("post-message", this.currentPostId ? "Post updated!" : "Post created!", "success");
      this.hidePostForm();
      this.loadPosts();
    } else {
      this.showMessage("post-message", data.message || "Failed to save post", "error");
    }
  }

  async deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const response = await this.fetchWithAuth(`${this.API_BASE}/posts/${postId}`, { method: "DELETE" });
    if (!response) return;
    if (response.ok) {
      this.loadPosts();
    } else {
      const data = await response.json();
      alert(data.message || "Failed to delete post");
    }
  }

  editPost(postId) { this.showPostForm(postId); }

  async viewPost(postId) {
    const response = await fetch(`${this.API_BASE}/posts/${postId}`);
    if (!response.ok) { alert("Failed to load post."); return; }
    const { data: post } = await response.json();
    document.getElementById("post-detail").innerHTML = `
      <h2>${this.escapeHtml(post.title)}</h2>
      <div class="post-meta">
        By ${this.escapeHtml(post.authorUsername)} • ${new Date(post.createdAt).toLocaleDateString()}
        ${post.updatedAt !== post.createdAt ? ` • Updated ${new Date(post.updatedAt).toLocaleDateString()}` : ""}
      </div>
      <div class="post-content" style="white-space:pre-wrap">${this.escapeHtml(post.content)}</div>
    `;
    document.getElementById("post-modal").classList.remove("hidden");
  }

  closeModal() { document.getElementById("post-modal").classList.add("hidden"); }

  // ── Utilities ─────────────────────────────────────────────────
  showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent  = message;
    el.className    = `message ${type}`;
    setTimeout(() => { el.textContent = ""; el.className = "message"; }, 5000);
  }

  escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }
}

let app;
document.addEventListener("DOMContentLoaded", () => { app = new BlogApp(); });
