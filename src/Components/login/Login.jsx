import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import MainPage from "../pages/MainPage";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {


    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }


    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userName", data.user.name);

      navigate("/home");
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button onClick={handleLogin}>Login</button>

        <p className="switch-text">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
