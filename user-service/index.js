/**
 * index.js (User Service)
 */

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose(); // Use the sqlite3 library
const jwt = require("jsonwebtoken");

const SECRET_KEY = "your-secret-key"; // Use process.env in production
const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies in incoming requests

// Connect to a local SQLite database file (user.db).
const db = new sqlite3.Database("./user.db", (err) => {
  if (err) {
    return console.error("Could not connect to user database:", err.message);
  }
  console.log("Connected to the local SQLite user database.");
});

// Create a "users" table if it doesn't exist.
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error("Failed to create users table:", err.message);
  } else {
    console.log("Ensured 'users' table exists.");
  }
});

/**
 * CRUD Endpoints for Users
 * ---------------------------------------
 * C = Create => POST /users
 * R = Read   => GET /users, GET /users/:id
 * U = Update => PUT /users/:id
 * D = Delete => DELETE /users/:id
 */

// CREATE a new user
app.post("/users", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields: username, email, password" });
  }

  const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  const params = [username, email, password];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error creating user:", err.message);
      return res.status(500).json({ error: "Failed to create user" });
    }
    return res.status(201).json({ id: this.lastID, username, email });
  });
});

// READ all users
app.get("/users", (req, res) => {
  const sql = `SELECT id, username, email FROM users`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err.message);
      return res.status(500).json({ error: "Failed to retrieve users" });
    }
    return res.json(rows);
  });
});

// READ a single user by ID
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT id, username, email FROM users WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Error fetching user:", err.message);
      return res.status(500).json({ error: "Failed to retrieve user" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(row);
  });
});

// UPDATE a user by ID
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields: username, email, password" });
  }

  const sql = `UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?`;
  const params = [username, email, password, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error updating user:", err.message);
      return res.status(500).json({ error: "Failed to update user" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: `User ${id} updated successfully` });
  });
});

// DELETE a user by ID
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM users WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Error deleting user:", err.message);
      return res.status(500).json({ error: "Failed to delete user" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: `User ${id} deleted successfully` });
  });
});

// Start the Express server
const PORT = process.env.USER_PORT || 3002;
app.listen(PORT, () => {
  console.log(`User Service listening on port ${PORT}`);
});


// Example: POST /login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // Validate user in DB (compare hashed passwords, etc.)
  // If valid:
  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
  return res.json({ token });
});
