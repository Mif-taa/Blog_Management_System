# 📝 Blog Management System

A full-stack **Blog Management System** built with Node.js and Express.js, featuring JWT authentication and PostgreSQL persistence. Deployed live on Render.

🔗 **Live Demo:** [https://blog-management-system-1-vdh6.onrender.com]

---

## ✨ Features

- 🔐 User registration and login with JWT authentication
- 🔒 Passwords hashed securely with bcrypt
- 📝 Full blog CRUD — Create, Read, Update, Delete posts
- 👤 Only post authors can edit or delete their own posts
- 🐘 PostgreSQL database in production (Render)
- 📄 JSON file storage for local development (no setup needed)
- 🌐 Responsive frontend with vanilla JavaScript
- 🛡️ Protected API routes with auth middleware

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcryptjs |
| Database (prod) | PostgreSQL (Render) |
| Database (local) | JSON file |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Hosting | Render |

---

## 📁 Project Structure

```
Blog Management System/
├── server.js                  ← Entry point
├── .env                       ← Environment variables (not pushed)
├── controllers/
│   ├── authController.js      ← Register, login logic
│   └── postController.js      ← CRUD logic
├── middleware/
│   └── auth.js                ← JWT verification
├── routes/
│   ├── auth.js                ← /api/auth/*
│   └── posts.js               ← /api/posts/*
├── data/
│   └── store.js               ← Dual-mode storage (PostgreSQL / JSON)
└── public/
    ├── index.html             ← Frontend UI
    ├── style.css              ← Styles
    └── app.js                 ← Frontend JavaScript
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and get JWT token |
| GET | `/api/auth/me` | 🔐 Yes | Verify current token |
| GET | `/api/posts` | No | Get all posts |
| GET | `/api/posts/:id` | No | Get single post |
| POST | `/api/posts` | 🔐 Yes | Create a post |
| PUT | `/api/posts/:id` | 🔐 Owner | Update a post |
| DELETE | `/api/posts/:id` | 🔐 Owner | Delete a post |

---

## 🚀 Run Locally

**1. Clone the repository**
```bash
git clone https://github.com/Mif-taa/Blog_Management_System.git
cd Blog_Management_System
```

**2. Install dependencies**
```bash
npm install
```

**3. Create a `.env` file**
```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3000
DATABASE_URL=
```

**4. Start the server**
```bash
node server.js
```

**5. Open in browser**
```
http://localhost:3000
```

> No database setup needed for local dev — data is saved to `data/db.json` automatically.

---

## 🌍 Deploy to Render

1. Push this repo to GitHub
2. Create a **PostgreSQL** database on [Render](https://render.com)
3. Create a **Web Service** connected to this repo
4. Set these environment variables on Render:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Render PostgreSQL internal URL |
| `JWT_SECRET` | Any strong random string |
| `JWT_EXPIRES_IN` | `7d` |

5. Build command: `npm install`
6. Start command: `node server.js`

---

## 👤 Author

**Your Name**
- GitHub: [@Mif-taa](https://github.com/Mif-taa)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
