import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function OutfitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        const res = await fetch(`/api/outfit/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not load outfit details.");
        const data = await res.json();
        setOutfit(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOutfit();
  }, [id, token]);

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ color: "red" }}>{error || "Outfit not found."}</p>
          <button
            style={backBtnStyle}
            onClick={() => navigate("/create-outfit")}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const { occasion, target_date, status, location, weather, generated_outfit } =
    outfit;

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <button style={backBtnStyle} onClick={() => navigate("/create-outfit")}>
          ← Back to Create Outfit
        </button>

        <h1 style={titleStyle}>Outfit Details</h1>

        {/* Info Grid */}
        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Occasion</span>
            <span style={infoValueStyle}>{occasion}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Destination</span>
            <span style={infoValueStyle}>
              {location.state}, {location.country}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Date</span>
            <span style={infoValueStyle}>{target_date}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Status</span>
            <span
              style={{
                ...infoValueStyle,
                color: status === "completed" ? "#27ae60" : "#e67e22",
                fontWeight: 600,
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>

        {/* Weather Section */}
        <div style={weatherBoxStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>
            🌤️ Weather Conditions
          </h3>
          <div style={weatherGridStyle}>
            <div>
              <span style={weatherLabelStyle}>Condition</span>
              <span style={weatherValueStyle}>{weather.weather_condition}</span>
            </div>
            <div>
              <span style={weatherLabelStyle}>Average</span>
              <span style={weatherValueStyle}>
                {weather.temperature_avg.toFixed(1)}°C
              </span>
            </div>
            <div>
              <span style={weatherLabelStyle}>High</span>
              <span style={weatherValueStyle}>
                {weather.temperature_max.toFixed(1)}°C
              </span>
            </div>
            <div>
              <span style={weatherLabelStyle}>Low</span>
              <span style={weatherValueStyle}>
                {weather.temperature_min.toFixed(1)}°C
              </span>
            </div>
          </div>
        </div>

        {/* Generated Outfit */}
        {generated_outfit && (
          <div style={{ marginTop: "30px" }}>
            <h3
              style={{
                fontSize: "20px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              ✨ Generated Outfit
            </h3>
            {generated_outfit.image_url && (
              <div style={{ textAlign: "center" }}>
                <img
                  src={`http://localhost:8000${generated_outfit.image_url}`}
                  alt="Generated Outfit"
                  style={outfitImageStyle}
                />
              </div>
            )}
            <div style={descriptionBoxStyle}>
              <p style={{ margin: "0 0 8px" }}>
                <strong>Top:</strong> {generated_outfit.top_description}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Bottom:</strong> {generated_outfit.bottom_description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const pageStyle = {
  minHeight: "100vh",
  background: "#eeeeee",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  fontFamily: "Arial, sans-serif",
  padding: "40px 20px",
};

const cardStyle = {
  background: "#fff",
  padding: "40px",
  borderRadius: "18px",
  width: "700px",
  maxWidth: "100%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const backBtnStyle = {
  background: "none",
  border: "none",
  color: "#6c5ce7",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  padding: 0,
  marginBottom: "20px",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: 600,
  color: "#111",
  marginBottom: "24px",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginBottom: "24px",
};

const infoItemStyle = {
  display: "flex",
  flexDirection: "column",
  background: "#f8f8f8",
  padding: "14px",
  borderRadius: "10px",
};

const infoLabelStyle = {
  fontSize: "12px",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "4px",
};

const infoValueStyle = {
  fontSize: "15px",
  color: "#111",
  fontWeight: 500,
};

const weatherBoxStyle = {
  background: "#f0f4f8",
  borderRadius: "12px",
  padding: "16px",
  borderLeft: "4px solid #6c5ce7",
};

const weatherGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "12px",
};

const weatherLabelStyle = {
  display: "block",
  fontSize: "11px",
  color: "#888",
  textTransform: "uppercase",
};

const weatherValueStyle = {
  display: "block",
  fontSize: "15px",
  fontWeight: 600,
  color: "#333",
  marginTop: "2px",
};

const outfitImageStyle = {
  width: "100%",
  maxWidth: "450px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  objectFit: "cover",
  aspectRatio: "1/1",
};

const descriptionBoxStyle = {
  marginTop: "20px",
  background: "#f9f9f9",
  padding: "16px",
  borderRadius: "8px",
};
