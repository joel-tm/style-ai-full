import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SuggestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const res = await fetch(`/api/outfit/suggest-history/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok)
          throw new Error("Could not load suggested outfit details.");
        const data = await res.json();
        setSuggestion(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSuggestion();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ color: "red" }}>
            {error || "Suggested outfit not found."}
          </p>
          <button
            style={backBtnStyle}
            onClick={() => navigate("/suggest-outfit")}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <button
          style={backBtnStyle}
          onClick={() => navigate("/suggest-outfit")}
        >
          ← Back to Suggest Outfit
        </button>

        <h1 style={titleStyle}>Suggested Outfit Details</h1>

        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Occasion</span>
            <span style={infoValueStyle}>{suggestion.occasion}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Destination</span>
            <span style={infoValueStyle}>
              {suggestion.location.state}, {suggestion.location.country}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Date</span>
            <span style={infoValueStyle}>{suggestion.target_date}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Saved At</span>
            <span style={infoValueStyle}>
              {new Date(suggestion.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {suggestion.weather && (
          <div style={weatherBoxStyle}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              🌤️ Weather Conditions
            </h3>
            <div style={weatherGridStyle}>
              <div>
                <span style={weatherLabelStyle}>Condition</span>
                <span style={weatherValueStyle}>
                  {suggestion.weather.weather_condition}
                </span>
              </div>
              <div>
                <span style={weatherLabelStyle}>Average</span>
                <span style={weatherValueStyle}>
                  {suggestion.weather.temperature_avg.toFixed(1)}°C
                </span>
              </div>
              <div>
                <span style={weatherLabelStyle}>High</span>
                <span style={weatherValueStyle}>
                  {suggestion.weather.temperature_max.toFixed(1)}°C
                </span>
              </div>
              <div>
                <span style={weatherLabelStyle}>Low</span>
                <span style={weatherValueStyle}>
                  {suggestion.weather.temperature_min.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={suggestionBoxStyle}>
          <h3 style={{ margin: "0 0 10px", fontSize: "18px" }}>
            Styling Suggestion
          </h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
            {suggestion.suggestion}
          </p>
        </div>

        {suggestion.selected_items?.length > 0 && (
          <div style={{ marginTop: "28px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "18px" }}>
              Selected Items
            </h3>
            <div style={selectedItemsGridStyle}>
              {suggestion.selected_items.map((item) => (
                <div key={item.id} style={selectedItemCardStyle}>
                  <img
                    src={`http://localhost:8000${item.bg_removed_image_url || item.image_url}`}
                    alt={item.category}
                    style={selectedItemImageStyle}
                  />
                  <div style={selectedItemMetaStyle}>
                    <p style={selectedItemTitleStyle}>{item.category}</p>
                    <span style={selectedItemIdStyle}>Item #{item.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  width: "980px",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
  marginBottom: "24px",
};

const weatherGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
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

const suggestionBoxStyle = {
  background: "#f9f9f9",
  padding: "18px",
  borderRadius: "12px",
};

const selectedItemsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const selectedItemCardStyle = {
  background: "linear-gradient(180deg, #fafafa 0%, #f1f4f7 100%)",
  borderRadius: "16px",
  padding: "14px",
  overflow: "hidden",
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
};

const selectedItemImageStyle = {
  width: "100%",
  aspectRatio: "4/5",
  objectFit: "cover",
  borderRadius: "12px",
};

const selectedItemMetaStyle = {
  marginTop: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const selectedItemTitleStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  textAlign: "center",
  color: "#111",
};

const selectedItemIdStyle = {
  fontSize: "12px",
  color: "#666",
  textAlign: "center",
};
