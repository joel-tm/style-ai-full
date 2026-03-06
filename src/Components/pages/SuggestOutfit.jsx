import React, { useState, useEffect, useMemo } from "react";
import { Select, Button, DatePicker, Input } from "antd";
import { Country, State } from "country-state-city";
import { useNavigate } from "react-router-dom";
import "antd/dist/reset.css";

const { Option } = Select;

const ALLOWED_COUNTRIES = [
  "AE",
  "SA",
  "TH",
  "US",
  "SG",
  "GB",
  "MY",
  "ID",
  "VN",
  "HK",
  "IN",
];

export default function SuggestOutfit() {
  const [occasion, setOccasion] = useState("");
  const [country, setCountry] = useState(null);
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [hiddenCards, setHiddenCards] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const [wardrobeItems, setWardrobeItems] = useState([]);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch wardrobe items on mount
  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        const res = await fetch("/api/wardrobe", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWardrobeItems(data);
        }
      } catch (err) {
        console.error("Failed to load wardrobe", err);
      }
    };

    const fetchSuggestionHistory = async () => {
      try {
        const res = await fetch("/api/outfit/suggest-history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestionHistory(data);
        }
      } catch (err) {
        console.error("Failed to load suggestion history", err);
      }
    };

    if (token) {
      fetchWardrobe();
      fetchSuggestionHistory();
    }
  }, [token]);

  const allowedCountries = useMemo(() => {
    return Country.getAllCountries().filter((c) =>
      ALLOWED_COUNTRIES.includes(c.isoCode),
    );
  }, []);

  const states = useMemo(() => {
    if (!country) return [];
    const allStates = State.getStatesOfCountry(country);
    const seen = new Set();
    return allStates.filter((state) => {
      if (seen.has(state.name)) return false;
      seen.add(state.name);
      return true;
    });
  }, [country]);

  const handleSuggest = async () => {
    if (!occasion || !country || !place) {
      setErrorMsg("Please fill in Occasion, Country, and State.");
      return;
    }

    if (wardrobeItems.length === 0) {
      setErrorMsg("Your wardrobe is empty. Add some clothes first!");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuggestion(null);

    try {
      const res = await fetch("/api/outfit/suggest-from-wardrobe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          occasion,
          country,
          state: place,
          target_date: date ? date.format("YYYY-MM-DD") : null,
          latitude: (() => {
            const s = states.find((st) => st.name === place);
            return s?.latitude ? parseFloat(s.latitude) : null;
          })(),
          longitude: (() => {
            const s = states.find((st) => st.name === place);
            return s?.longitude ? parseFloat(s.longitude) : null;
          })(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Suggestion failed.");
      }

      const data = await res.json();
      setSuggestion(data);
      try {
        const historyRes = await fetch("/api/outfit/suggest-history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setSuggestionHistory(historyData);
        }
      } catch (historyErr) {
        console.error("Failed to refresh suggestion history", historyErr);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCardVisibility = (id, event) => {
    event.stopPropagation();
    setHiddenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Group wardrobe items by category for display
  const groupedItems = wardrobeItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div style={pageStyle}>
      <div style={{ width: "100%", maxWidth: "1400px" }}>
        <button style={backHomeBtnStyle} onClick={() => navigate("/home")}>
          ← Back to Home
        </button>
      </div>
      <div style={topRowStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Suggest a Great Outfit</h1>
          <p style={subtitleStyle}>
            We'll pick the best outfit from your wardrobe
          </p>

          <div style={fieldStyle}>
            <label style={labelStyle}>Occasion</label>
            <Input
              placeholder="Eg: Wedding, Office, Party"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
            />
          </div>

          {/* Country */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Country</label>
            <Select
              placeholder="Select country"
              value={country}
              onChange={(value) => {
                setCountry(value);
                setPlace("");
              }}
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="children"
              getPopupContainer={(node) => node.parentNode}
            >
              {allowedCountries.map((c) => (
                <Option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* State/Region */}
          <div style={fieldStyle}>
            <label style={labelStyle}>State / Region</label>
            <Select
              placeholder="Select state"
              value={place}
              onChange={(value) => setPlace(value)}
              style={{ width: "100%" }}
              disabled={!country}
              showSearch
              optionFilterProp="children"
              getPopupContainer={(node) => node.parentNode}
            >
              {states.map((state) => (
                <Option
                  key={`${state.name}-${state.isoCode}`}
                  value={state.name}
                >
                  {state.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* Optional Date */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Date{" "}
              <span style={{ color: "#888", fontWeight: "normal" }}>
                (Optional)
              </span>
            </label>
            <DatePicker
              style={{ width: "100%" }}
              value={date}
              onChange={(val) => setDate(val)}
              placeholder="Select a date"
              getPopupContainer={(node) => node.parentNode}
            />
          </div>

          {/* Wardrobe summary */}
          <div style={wardrobeSummaryStyle}>
            <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
              👕 Your wardrobe: <strong>{wardrobeItems.length}</strong> items
              {Object.keys(groupedItems).length > 0 && (
                <span>
                  {" · "}
                  {Object.entries(groupedItems)
                    .map(([cat, items]) => `${items.length} ${cat}`)
                    .join(", ")}
                </span>
              )}
            </p>
          </div>

          <Button
            type="primary"
            block
            size="large"
            style={generateButtonStyle}
            onClick={handleSuggest}
            loading={isLoading}
            disabled={wardrobeItems.length === 0}
          >
            {isLoading
              ? "Finding the best outfit..."
              : "Suggest an Outfit from My Wardrobe"}
          </Button>

          {errorMsg && (
            <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>
              {errorMsg}
            </p>
          )}
        </div>

        {/* Results Section */}
        {suggestion && (
          <div style={resultsCardStyle}>
            <h3
              style={{
                fontSize: "22px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              Suggested Outfit
            </h3>

            {suggestion.weather && (
              <div style={weatherSectionStyle}>
                <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>
                  🌤️ Weather
                </h3>
                <p style={{ margin: 0, color: "#555" }}>
                  {suggestion.weather.temperature_avg.toFixed(1)}°C |{" "}
                  {suggestion.weather.weather_condition}
                </p>
              </div>
            )}

            {suggestion.suggestion && (
              <div style={suggestionTextStyle}>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {suggestion.suggestion}
                </p>
              </div>
            )}

            {suggestion.selected_items &&
              suggestion.selected_items.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "16px", marginBottom: "12px" }}>
                    Selected Items
                  </h4>
                  <div style={suggestedItemsGrid}>
                    {suggestion.selected_items.map((item) => (
                      <div key={item.id} style={suggestedItemCard}>
                        <img
                          src={`http://localhost:8000${item.bg_removed_image_url || item.image_url}`}
                          alt={item.category}
                          style={suggestedItemImage}
                        />
                        <div style={suggestedItemMetaStyle}>
                          <p style={suggestedItemTitleStyle}>{item.category}</p>
                          <span style={suggestedItemIdStyle}>
                            Item #{item.id}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {suggestionHistory.length > 0 && (
        <div style={historySectionStyle}>
          <div style={historyHeaderStyle}>
            <h2 style={{ fontSize: "24px", margin: 0, color: "#111" }}>
              Past Suggested Outfits
            </h2>
            <button
              style={toggleBtnStyle}
              onClick={() => setShowHistory((prev) => !prev)}
            >
              {showHistory ? "Hide All ▲" : "Show All ▼"}
            </button>
          </div>

          {showHistory && (
            <div style={historyGridStyle}>
              {suggestionHistory.map((item) => {
                const isHidden = hiddenCards.has(item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      ...historyCardStyle,
                      opacity: isHidden ? 0.45 : 1,
                      cursor: isHidden ? "default" : "pointer",
                    }}
                    onClick={() =>
                      !isHidden &&
                      navigate(`/suggest-outfit/history/${item.id}`)
                    }
                  >
                    <button
                      style={cardToggleBtnStyle}
                      onClick={(event) => toggleCardVisibility(item.id, event)}
                      title={isHidden ? "Show card" : "Hide card"}
                    >
                      {isHidden ? "👁️" : "✕"}
                    </button>

                    {!isHidden && item.selected_items?.length > 0 && (
                      <div style={historySelectedGridStyle}>
                        {item.selected_items.slice(0, 3).map((selectedItem) => (
                          <img
                            key={`${item.id}-${selectedItem.id}`}
                            src={`http://localhost:8000${selectedItem.bg_removed_image_url || selectedItem.image_url}`}
                            alt={selectedItem.category}
                            style={historySelectedImageStyle}
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ padding: "14px" }}>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontWeight: 600,
                          fontSize: "16px",
                          color: isHidden ? "#aaa" : "#111",
                        }}
                      >
                        {item.occasion}
                      </p>
                      {!isHidden && (
                        <>
                          <p style={historyMetaTextStyle}>
                            📍 {item.location.state}, {item.location.country}
                          </p>
                          <p style={historyMetaTextStyle}>
                            📅 {item.target_date}
                          </p>
                          {item.weather && (
                            <p style={historyWeatherTextStyle}>
                              🌤️ {item.weather.weather_condition} ·{" "}
                              {item.weather.temperature_avg.toFixed(1)}°C
                            </p>
                          )}
                          <p style={historySuggestionStyle}>
                            {item.suggestion}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */

const pageStyle = {
  minHeight: "100vh",
  background: "#eeeeee",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontFamily: "Arial, sans-serif",
  padding: "40px 20px",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "24px",
  width: "100%",
  maxWidth: "1400px",
};

const cardStyle = {
  background: "#ffffff",
  padding: "40px",
  borderRadius: "18px",
  width: "100%",
  maxWidth: "660px",
  flex: "1 1 520px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const backHomeBtnStyle = {
  background: "none",
  border: "none",
  color: "#6c5ce7",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  padding: 0,
  marginBottom: "12px",
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: "600",
  color: "#111",
  marginBottom: "8px",
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#666",
  marginBottom: "30px",
};

const fieldStyle = {
  marginBottom: "20px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  color: "#111",
};

const generateButtonStyle = {
  background: "#111",
  borderColor: "#111",
  marginTop: "10px",
};

const wardrobeSummaryStyle = {
  background: "#f0f4f8",
  padding: "12px 16px",
  borderRadius: "10px",
  marginBottom: "16px",
  borderLeft: "4px solid #6c5ce7",
};

const resultsCardStyle = {
  background: "#ffffff",
  padding: "40px",
  borderRadius: "18px",
  width: "100%",
  maxWidth: "660px",
  flex: "1 1 520px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
};

const weatherSectionStyle = {
  padding: "16px",
  background: "#f0f4f8",
  borderRadius: "12px",
  marginBottom: "24px",
  borderLeft: "4px solid #6c5ce7",
};

const suggestionTextStyle = {
  background: "#f9f9f9",
  padding: "16px",
  borderRadius: "10px",
  marginBottom: "24px",
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#333",
};

const historySectionStyle = {
  width: "100%",
  maxWidth: "1400px",
  marginTop: "40px",
};

const historyGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: "20px",
};

const historyCardStyle = {
  background: "#fff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  transition: "transform 0.2s, box-shadow 0.2s, opacity 0.3s",
  position: "relative",
};

const historyHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const toggleBtnStyle = {
  background: "#6c5ce7",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const cardToggleBtnStyle = {
  position: "absolute",
  top: "8px",
  right: "8px",
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "28px",
  height: "28px",
  fontSize: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
};

const suggestedItemsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "18px",
};

const suggestedItemCard = {
  background: "linear-gradient(180deg, #fafafa 0%, #f1f4f7 100%)",
  borderRadius: "16px",
  padding: "14px",
  overflow: "hidden",
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
};

const suggestedItemImage = {
  width: "100%",
  aspectRatio: "4/5",
  objectFit: "cover",
  borderRadius: "12px",
};

const suggestedItemMetaStyle = {
  marginTop: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const suggestedItemTitleStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  textAlign: "center",
  color: "#111",
};

const suggestedItemIdStyle = {
  fontSize: "12px",
  color: "#666",
  textAlign: "center",
};

const historySelectedGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "8px",
  padding: "12px 12px 0",
};

const historySelectedImageStyle = {
  width: "100%",
  aspectRatio: "4/5",
  objectFit: "cover",
  borderRadius: "10px",
  background: "#f4f4f4",
};

const historyMetaTextStyle = {
  margin: "0 0 6px",
  fontSize: "13px",
  color: "#555",
};

const historyWeatherTextStyle = {
  margin: "0 0 10px",
  fontSize: "12px",
  color: "#888",
};

const historySuggestionStyle = {
  margin: 0,
  fontSize: "13px",
  color: "#333",
  lineHeight: "1.5",
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
