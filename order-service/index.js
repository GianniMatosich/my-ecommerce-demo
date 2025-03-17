/**
 * index.js (Order Service)
 */

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose(); // Use the sqlite3 library

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies in incoming requests

// Connect to a local SQLite database file (order.db).
const db = new sqlite3.Database("./order.db", (err) => {
  if (err) {
    return console.error("Could not connect to order database:", err.message);
  }
  console.log("Connected to the local SQLite order database.");
});

// Create an "orders" table if it doesn't exist.
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
    console.error("Failed to create orders table:", err.message);
  } else {
    console.log("Ensured 'orders' table exists.");
  }
});

/**
 * CRUD Endpoints for Orders
 * ---------------------------------------
 * C = Create => POST /orders
 * R = Read   => GET /orders, GET /orders/:id
 * U = Update => PUT /orders/:id
 * D = Delete => DELETE /orders/:id
 */

// CREATE a new order
app.post("/orders", (req, res) => {
  const { userId, productId, quantity, status } = req.body;

  if (!userId || !productId || !quantity || !status) {
    return res.status(400).json({ error: "Missing required fields: userId, productId, quantity, status" });
  }

  const sql = `INSERT INTO orders (userId, productId, quantity, status) VALUES (?, ?, ?, ?)`;
  const params = [userId, productId, quantity, status];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error creating order:", err.message);
      return res.status(500).json({ error: "Failed to create order" });
    }
    return res.status(201).json({ id: this.lastID, userId, productId, quantity, status });
  });
});

// READ all orders
app.get("/orders", (req, res) => {
  const sql = `SELECT * FROM orders`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching orders:", err.message);
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }
    return res.json(rows);
  });
});

// READ a single order by ID
app.get("/orders/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM orders WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Error fetching order:", err.message);
      return res.status(500).json({ error: "Failed to retrieve order" });
    }
    if (!row) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json(row);
  });
});

// UPDATE an order by ID
app.put("/orders/:id", (req, res) => {
  const { id } = req.params;
  const { userId, productId, quantity, status } = req.body;

  if (!userId || !productId || !quantity || !status) {
    return res.status(400).json({ error: "Missing required fields: userId, productId, quantity, status" });
  }

  const sql = `UPDATE orders SET userId = ?, productId = ?, quantity = ?, status = ? WHERE id = ?`;
  const params = [userId, productId, quantity, status, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error updating order:", err.message);
      return res.status(500).json({ error: "Failed to update order" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json({ message: `Order ${id} updated successfully` });
  });
});

// DELETE an order by ID
app.delete("/orders/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM orders WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Error deleting order:", err.message);
      return res.status(500).json({ error: "Failed to delete order" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json({ message: `Order ${id} deleted successfully` });
  });
});

// Start the Express server
const PORT = process.env.ORDER_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Order Service listening on port ${PORT}`);
});

const axios = require("axios");
const CATALOG_URL = process.env.CATALOG_URL || "http://localhost:3001";

async function getProductInfo(productId) {
  const response = await axios.get(`${CATALOG_URL}/products/${productId}`);
  return response.data;
}
