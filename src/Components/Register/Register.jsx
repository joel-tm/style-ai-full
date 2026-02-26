import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",
    date_of_birth: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    const { name, email, password, gender, date_of_birth } = formData;

    if (!name || !email || !password || !gender || !date_of_birth) {
      setError("Please enter all fields");
      return;
    }

    // Validate DOB is in the past
    if (new Date(date_of_birth) >= new Date()) {
      setError("Date of birth must be in the past");
      return;
    }

    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, gender, date_of_birth }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userName", data.user.name);

      navigate("/Profession"); /*the page to navigate after login in*/
    } catch (err) {
      setError("Server error. Please try again.", err);
    }
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

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "none",
            borderRadius: "8px",
            background: "#e6e6e6",
            outline: "none",
            fontSize: "14px",
            color: formData.gender ? "#000" : "#888",
            appearance: "auto",
          }}
        >
          <option value="" disabled>
            Gender
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>

        <input
          type="date"
          name="date_of_birth"
          placeholder="Date of Birth"
          value={formData.date_of_birth}
          onChange={handleChange}
          max={new Date().toISOString().split("T")[0]}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "none",
            borderRadius: "8px",
            background: "#e6e6e6",
            outline: "none",
            fontSize: "14px",
            color: formData.date_of_birth ? "#000" : "#888",
          }}
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

        <p onClick={() => navigate("/Login")} className="switch-text">
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}
