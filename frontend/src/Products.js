import React, { useEffect, useState } from "react";

/**
 * Fetches products from the Catalog Service at http://localhost:3001/products
 * Displays them in a simple list.
 */
export default function Products() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const resp = await fetch("http://localhost:3001/products");
        if (!resp.ok) {
          setMessage("Failed to fetch products");
          return;
        }
        const data = await resp.json();
        setProducts(data);
      } catch (error) {
        console.error("Fetch error:", error);
        setMessage("An error occurred fetching products.");
      }
    }
    fetchProducts();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Catalog Products</h2>
      {message && <p>{message}</p>}
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} - ${p.price} 
            <br />
            {p.description || "No description"}
          </li>
        ))}
      </ul>
    </div>
  );
}
