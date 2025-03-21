const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// Secret key used for verifying JSON Web Tokens
const SECRET_KEY = "your-secret-key";

// Open or create the SQLite database file
const db = new sqlite3.Database("./order.db", (err) => {
  if (err) {
    return console.error("Database connection issue:", err.message);
  }
  console.log("Order database is ready.");
});

// Ensure the orders table exists
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error("Cannot create orders table:", err.message);
  } else {
    console.log("Orders table is confirmed.");
  }
});

// Middleware that checks for a valid JWT in the Authorization header
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

// Fetch all orders
app.get("/orders", (req, res) => {
  const sql = "SELECT * FROM orders";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Cannot retrieve orders:", err.message);
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }
    return res.json(rows);
  });
});

// Fetch a specific order by ID
app.get("/orders/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM orders WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Cannot retrieve order:", err.message);
      return res.status(500).json({ error: "Failed to retrieve order" });
    }
    if (!row) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json(row);
  });
});

// Update an existing order
app.put("/orders/:id", (req, res) => {
  const { id } = req.params;
  const { userId, productId, quantity, status } = req.body;
  if (!userId || !productId || !quantity || !status) {
    return res.status(400).json({
      error: "Missing required fields: userId, productId, quantity, status"
    });
  }

  const sql = `
    UPDATE orders
    SET userId = ?, productId = ?, quantity = ?, status = ?
    WHERE id = ?
  `;
  const params = [userId, productId, quantity, status, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Cannot update order:", err.message);
      return res.status(500).json({ error: "Failed to update order" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json({ message: `Order ${id} updated successfully` });
  });
});

// Delete an order by ID
app.delete("/orders/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM orders WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Cannot delete order:", err.message);
      return res.status(500).json({ error: "Failed to delete order" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json({ message: `Order ${id} deleted successfully` });
  });
});

// Create a new order (requires a valid token)
app.post("/orders", authenticateToken, (req, res) => {
  const { productId, quantity } = req.body;
  const status = "NEW";
  const userId = 1;

  if (!productId || !quantity) {
    return res.status(400).json({ error: "Missing productId or quantity" });
  }

  const sql = `
    INSERT INTO orders (userId, productId, quantity, status)
    VALUES (?, ?, ?, ?)
  `;
  const params = [userId, productId, quantity, status];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Cannot create order:", err.message);
      return res.status(500).json({ error: "Failed to create order" });
    }
    return res.status(201).json({
      id: this.lastID,
      userId,
      productId,
      quantity,
      status
    });
  });
});

// Example function to retrieve product data from the Catalog Service
const CATALOG_URL = process.env.CATALOG_URL || "http://localhost:3001";
async function getProductInfo(productId) {
  const response = await axios.get(`${CATALOG_URL}/products/${productId}`);
  return response.data;
}

// Start listening on the assigned port
const PORT = process.env.ORDER_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Order Service listening on port ${PORT}`);
});
