
import React from "react";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/Login");
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={mainTitle}>
        <div style={headerRow}>
          <h1 style={mainTitleStyle}>Welcome, {userName} 👋</h1>
          <button onClick={handleLogout} style={logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={pageStyle}>
        {/* Heading */}
        <h1 style={titleStyle}>Choose what you want</h1>

        {/* Options */}
        <div style={optionsContainer}>
          {/* Left */}
          <div
            style={cardStyle}
            onClick={() => navigate("/create-outfit")}
          >
            <h2 style={cardTitle}>Create Outfit</h2>
            <p style={cardText}>
              Let AI style the perfect outfit for you
            </p>
          </div>

          {/* Right */}
          <div
            style={cardStyle}
            onClick={() => navigate("/wardrobe")}
          >
            <h2 style={cardTitle}>My Wardrobe</h2>
            <p style={cardText}>
              View and manage your saved clothes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const mainTitle = {
  backgroundColor: "black",
  padding: "30px 40px",
  marginBottom: "0px",
  textAlign: "center",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

const logoutBtn = {
  background: "transparent",
  border: "1px solid #fff",
  color: "#fff",
  padding: "8px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
};

const mainTitleStyle = {
  color: "white",
  fontSize: "30px",
  fontWeight: "600",

  // marginBottom: "10px",
};

const pageStyle = {
  flex: "1",
  background: "#eeeeee",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
};

const titleStyle = {
  fontSize: "42px",
  fontWeight: "600",
  color: "#111",
  marginBottom: "60px",
};

const optionsContainer = {
  display: "flex",
  gap: "40px",
};

const cardStyle = {
  background: "#f7f7f7",
  width: "460px",
  height: "180px",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  border: "1px solid #ccc",
  transition: "all 0.25s ease",
};

const cardTitle = {
  fontSize: "22px",
  fontWeight: "600",
  color: "#000",
  marginBottom: "10px",
};

const cardText = {
  fontSize: "14px",
  color: "#555",
  textAlign: "center",
  padding: "0 20px",
};
