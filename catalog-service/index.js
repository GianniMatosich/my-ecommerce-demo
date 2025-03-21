const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the catalog database and confirm connectivity
const db = new sqlite3.Database("./catalog.db", (err) => {
  if (err) {
    return console.error("Unable to connect to catalog database:", err.message);
  }
  console.log("Catalog database is ready.");
});

// Create the products table if it doesn't already exist
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL
  )
`, (err) => {
  if (err) {
    console.error("Could not create products table:", err.message);
  } else {
    console.log("Products table is confirmed.");
  }
});

// Add a new product entry
app.post("/products", (req, res) => {
  const { name, description, price } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: "Missing required fields: name, price" });
  }
  const sql = "INSERT INTO products (name, description, price) VALUES (?, ?, ?)";
  db.run(sql, [name, description || "", price], function (err) {
    if (err) {
      console.error("Cannot create product:", err.message);
      return res.status(500).json({ error: "Failed to create product" });
    }
    return res.status(201).json({ id: this.lastID, name, description, price });
  });
});

// Retrieve all products
app.get("/products", (req, res) => {
  const sql = "SELECT * FROM products";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Cannot fetch products:", err.message);
      return res.status(500).json({ error: "Failed to retrieve products" });
    }
    return res.json(rows);
  });
});

// Retrieve a specific product by ID
app.get("/products/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM products WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Cannot fetch product:", err.message);
      return res.status(500).json({ error: "Failed to retrieve product" });
    }
    if (!row) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(row);
  });
});

// Update product details by ID
app.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: "Missing required fields: name, price" });
  }
  const sql = "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?";
  db.run(sql, [name, description || "", price, id], function (err) {
    if (err) {
      console.error("Cannot update product:", err.message);
      return res.status(500).json({ error: "Failed to update product" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json({ message: `Product ${id} updated successfully` });
  });
});

// Remove a product by ID
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM products WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Cannot delete product:", err.message);
      return res.status(500).json({ error: "Failed to delete product" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json({ message: `Product ${id} deleted successfully` });
  });
});

// Start listening on the assigned port
const PORT = process.env.CATALOG_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Catalog Service is running on port ${PORT}`);
});
