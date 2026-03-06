import React from "react";
import { useNavigate } from "react-router-dom";

import TextileShopFinder from "./TextileShopFinder";

export default function TextileShopPage() {
  const navigate = useNavigate();

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button
          type="button"
          style={backButtonStyle}
          onClick={() => navigate("/home")}
        >
          Back to Home
        </button>
        <h1 style={titleStyle}>Nearby Textile Shops</h1>
        <p style={subtitleStyle}>
          Enter a location and find nearby textile stores.
        </p>
      </div>

      <TextileShopFinder isOpen onClose={() => navigate("/home")} />
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "48px 24px 64px",
  background: "linear-gradient(180deg, #f5ece1 0%, #f8f8f8 45%, #ffffff 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const headerStyle = {
  width: "min(960px, 100%)",
  marginBottom: "12px",
};

const backButtonStyle = {
  border: "1px solid #22170f",
  background: "transparent",
  color: "#22170f",
  borderRadius: "999px",
  padding: "10px 18px",
  fontSize: "14px",
  cursor: "pointer",
};

const titleStyle = {
  margin: "22px 0 8px",
  fontSize: "40px",
  color: "#22170f",
};

const subtitleStyle = {
  margin: 0,
  fontSize: "16px",
  color: "#725c4a",
};
