
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = () => {
    const { name, email, password } = formData;

    if (!name || !email || !password) {
      setError("Please enter all fields");
      return;
    }

    setError("");

    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);

    navigate("/Profession");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Account</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />

        {error && <p className="error">{error}</p>}

        <button onClick={handleRegister}>Register</button>

        <p
         onClick={() => navigate("/Login")}
         className="switch-text">
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}
