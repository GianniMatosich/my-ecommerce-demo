import React, { useState, useEffect } from "react";

function App() {
  // 1) Store products in state
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  // 2) Fetch products on component load
  useEffect(() => {
    fetch("http://localhost:3001/products") // <-- Replace with your Catalog Service URL if needed
      .then((response) => {
        if (!response.ok) {
          // If HTTP status is not 2xx, throw an error
          throw new Error(
            `Network response was not ok (status: ${response.status})`
          );
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => {
        setError(err);
      });
  }, []); 
  // [] ensures this runs only once, when the component mounts

  // 3) Handle error state
  if (error) {
    return <div style={{ color: "red" }}>Error: {error.message}</div>;
  }

  // 4) Render product list
  return (
    <div>
      <h1>Product List</h1>
      {products.length === 0 && <p>No products found.</p>}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - ${product.price?.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
