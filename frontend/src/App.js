import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./Login";
import Products from "./Products";
import Orders from "./Orders";

/**
 * Sets up our main navigation and defines routes for:
 * - /login
 * - /products
 * - /orders
 */
export default function App() {
  return (
    <Router>
      <nav style={{ padding: "10px", marginBottom: "10px", borderBottom: "1px solid #ccc" }}>
        <Link to="/login" style={{ marginRight: "15px" }}>Login</Link>
        <Link to="/products" style={{ marginRight: "15px" }}>Products</Link>
        <Link to="/orders">Orders</Link>
      </nav>

      <Routes>
        {/* Default route goes to Login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </Router>
  );
}
