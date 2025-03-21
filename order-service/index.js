/**
 * index.js (Order Service)
 */

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose(); // Use the sqlite3 library
const jwt = require("jsonwebtoken"); // Verify tokens
const axios = require("axios"); // For calling Catalog Service if needed

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies in incoming requests

// A secret key for JWT verification (must match the User Service)
const SECRET_KEY = "your-secret-key";

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


function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // store user info in req
    next();
  });
}

/**
 * CRUD Endpoints for Orders
 * ---------------------------------------
 * GET /orders        => Fetch all orders 
 * GET /orders/:id    => Fetch one order  
 * PUT /orders/:id    => Update order      
 * DELETE /orders/:id => Delete order      
 * POST /orders       => Create order      (PROTECTED - requires JWT)
 */

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
    return res
      .status(400)
      .json({ error: "Missing required fields: userId, productId, quantity, status" });
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

app.post("/orders", authenticateToken, (req, res) => {
  const { productId, quantity } = req.body;
  const status = "NEW"; // Default status for new orders

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
      console.error("Error creating order:", err.message);
      return res.status(500).json({ error: "Failed to create order" });
    }
    // 'this.lastID' is the newly inserted row's ID
    return res.status(201).json({
      id: this.lastID,
      userId,
      productId,
      quantity,
      status
    });
  });
});

// (Optional) Example call to Catalog Service if needed
const CATALOG_URL = process.env.CATALOG_URL || "http://localhost:3001";
async function getProductInfo(productId) {
  const response = await axios.get(`${CATALOG_URL}/products/${productId}`);
  return response.data;
}

// Start the Express server
const PORT = process.env.ORDER_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Order Service listening on port ${PORT}`);
});
