/**
 * index.js (Catalog Service)
 */

const express = require("express");
const sqlite3 = require("sqlite3").verbose(); // 1) Import the sqlite3 library

const app = express();
app.use(express.json()); // 2) Parse JSON bodies in incoming requests

// 3) Connect to a local SQLite database file.
//    If the file doesn't exist, SQLite will create it for you.
const db = new sqlite3.Database("./catalog.db", (err) => {
  if (err) {
    return console.error("Could not connect to database:", err.message);
  }
  console.log("Connected to the local SQLite database.");
});

// 4) Create a "products" table if it doesn't exist yet.
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL
  )
`, (err) => {
  if (err) {
    console.error("Failed to create products table:", err.message);
  } else {
    console.log("Ensured 'products' table exists.");
  }
});

/**
 * 5) CRUD Endpoints
 *    -----------------------------
 *    C = Create => POST /products
 *    R = Read   => GET /products, GET /products/:id
 *    U = Update => PUT /products/:id
 *    D = Delete => DELETE /products/:id
 */

// 5.1) CREATE a new product
app.post("/products", (req, res) => {
  const { name, description, price } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ error: "Missing required fields: name, price" });
  }

  const sql = `INSERT INTO products (name, description, price) VALUES (?, ?, ?)`;
  const params = [name, description || "", price];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error creating product:", err.message);
      return res.status(500).json({ error: "Failed to create product" });
    }
    // 'this.lastID' gives the ID of the newly inserted row
    return res.status(201).json({ id: this.lastID, name, description, price });
  });
});

// 5.2) READ all products
app.get("/products", (req, res) => {
  const sql = `SELECT * FROM products`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching products:", err.message);
      return res.status(500).json({ error: "Failed to retrieve products" });
    }
    return res.json(rows);
  });
});

// 5.3) READ a single product by ID
app.get("/products/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM products WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Error fetching product:", err.message);
      return res.status(500).json({ error: "Failed to retrieve product" });
    }
    if (!row) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(row);
  });
});

// 5.4) UPDATE a product by ID
app.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ error: "Missing required fields: name, price" });
  }

  const sql = `UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?`;
  const params = [name, description || "", price, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error updating product:", err.message);
      return res.status(500).json({ error: "Failed to update product" });
    }
    // 'this.changes' tells how many rows were updated
    if (this.changes === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json({ message: `Product ${id} updated successfully` });
  });
});

// 5.5) DELETE a product by ID
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM products WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Error deleting product:", err.message);
      return res.status(500).json({ error: "Failed to delete product" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json({ message: `Product ${id} deleted successfully` });
  });
});

/**
 * 6) Start the Express server
 */
const PORT = process.env.CATALOG_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Catalog Service listening on port ${PORT}`);
});
