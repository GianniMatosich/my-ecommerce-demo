import React, { useState, useEffect } from "react";

/**
 * Demonstrates placing an order (POST /orders) with a valid JWT,
 * and listing existing orders (GET /orders).
 * Assumes the Order Service is at http://localhost:3003
 */
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");

  // Fetch existing orders (if any)
  useEffect(() => {
    async function fetchOrders() {
      try {
        const resp = await fetch("http://localhost:3003/orders");
        if (!resp.ok) {
          setMessage("Failed to fetch orders");
          return;
        }
        const data = await resp.json();
        setOrders(data);
      } catch (error) {
        console.error("Fetch orders error:", error);
        setMessage("Error fetching orders.");
      }
    }
    fetchOrders();
  }, []);

  // Function to place a new order
  async function handlePlaceOrder(e) {
    e.preventDefault();
    setMessage("Placing order...");

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("No token found. Please login first.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3003/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: parseInt(productId, 10),
          quantity: parseInt(quantity, 10),
          status: "NEW"
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setMessage(`Order failed: ${errData.error || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      setMessage(`Order created! ID: ${data.id}`);

      // Optionally refresh the orders list
      setOrders([...orders, data]);
    } catch (error) {
      console.error("Order creation error:", error);
      setMessage("An error occurred placing the order.");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Manage Orders</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handlePlaceOrder} style={{ marginBottom: 20 }}>
        <div>
          <label>Product ID: </label>
          <input 
            type="number"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <label>Quantity: </label>
          <input 
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <button type="submit" style={{ marginTop: 10 }}>
          Place Order
        </button>
      </form>

      <h3>Existing Orders</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            Order ID: {o.id}, Product: {o.productId}, Qty: {o.quantity}, 
            Status: {o.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
