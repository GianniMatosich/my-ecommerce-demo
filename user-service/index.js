const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");

const SECRET_KEY = "your-secret-key";
const app = express();
app.use(cors());
app.use(express.json());

// Initialize the SQLite database connection
const db = new sqlite3.Database("./user.db", (err) => {
  if (err) {
    return console.error("Could not connect to user database:", err.message);
  }
  console.log("Connected to the local SQLite user database.");
});

// Create a users table if none exists yet
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

// Add a new user to the database
app.post("/users", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields: username, email, password" });
  }
  const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  db.run(sql, [username, email, password], function (err) {
    if (err) {
      console.error("Error creating user:", err.message);
      return res.status(500).json({ error: "Failed to create user" });
    }
    return res.status(201).json({ id: this.lastID, username, email });
  });
});

// Retrieve a list of all users (excluding passwords)
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

// Retrieve a single user by ID (excluding password)
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

// Update user data by ID
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields: username, email, password" });
  }
  const sql = `UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?`;
  db.run(sql, [username, email, password, id], function (err) {
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

// Remove a user by ID
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

// Authenticate user credentials and issue a JSON Web Token
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.get(sql, [email, password], (err, user) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const tokenPayload = { id: user.id, email: user.email };
    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "1h" });
    return res.json({ token });
  });
});

// Start the server on the specified port
const PORT = process.env.USER_PORT || 3002;
app.listen(PORT, () => {
  console.log(`User Service listening on port ${PORT}`);
});
