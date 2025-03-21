import React, { useState } from "react";

/**
 * This component displays a login form and calls the User Service.
 * Assumes the User Service is at http://localhost:3002
 * POST /login
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const response = await fetch("http://localhost:3002/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setMessage(`Login failed: ${errData.error || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      // data.token is the JWT
      localStorage.setItem("token", data.token);
      setMessage("Login successful! Token stored in localStorage.");
    } catch (error) {
      console.error("Login error:", error);
      setMessage("An error occurred while logging in.");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login Page</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email: </label>
          <input 
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <label>Password: </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <button type="submit" style={{ marginTop: 10 }}>Login</button>
      </form>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}
