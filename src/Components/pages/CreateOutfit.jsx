
import React, { useState, useMemo } from "react";
import { Input, Select, Button, DatePicker } from "antd";
import { Country, State } from "country-state-city";
import "antd/dist/reset.css";

const { Option } = Select;

const ALLOWED_COUNTRIES = ["AE", "SA", "TH", "US", "SG", "GB", "MY", "ID", "VN", "HK"];

export default function CreateOutfit() {
  const [occasion, setOccasion] = useState("");
  const [country, setCountry] = useState(null);
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [generatedOutfit, setGeneratedOutfit] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [weatherLocation, setWeatherLocation] = useState("");

  const token = localStorage.getItem("token");

  const allowedCountries = useMemo(() => {
    return Country.getAllCountries().filter(c => ALLOWED_COUNTRIES.includes(c.isoCode));
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

  const handleGenerate = async () => {
    if (!occasion || !country || !place) {
      setErrorMsg("Please fill in Occasion, Country, and State.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setWeatherData(null);
    setGeneratedOutfit(null);
    setWeatherLocation("");

    const outfitData = {
      occasion,
      country,
      state: place, // backend expects "state"
      target_date: date ? date.format("YYYY-MM-DD") : null,
    };

    try {
      // 1. Fetch weather preview to display immediately
      const weatherRes = await fetch("/api/outfit/preview-weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(outfitData)
      });

      if (!weatherRes.ok) throw new Error("Could not fetch weather data.");
      const weather = await weatherRes.json();
      setWeatherData(weather);
      // Build a human-readable location name from the selected country & state
      const countryObj = allowedCountries.find(c => c.isoCode === country);
      setWeatherLocation(`${place}, ${countryObj ? countryObj.name : country}`);

      // 2. Instruct vertex to generate
      const genRes = await fetch("/api/outfit/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(outfitData)
      });

      if (!genRes.ok) throw new Error("Outfit generation failed.");
      const generated = await genRes.json();
      setGeneratedOutfit(generated.generated_outfit);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Create a Great Outfit</h1>
        <p style={subtitleStyle}>
          Tell us a little more and we’ll style you perfectly
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
          <label style={labelStyle}>Date <span style={{ color: "#888", fontWeight: "normal" }}>(Optional)</span></label>
          <DatePicker
            style={{ width: "100%" }}
            value={date}
            onChange={(val) => setDate(val)}
            placeholder="Select a date"
            getPopupContainer={(node) => node.parentNode}
          />
        </div>

        <Button
          type="primary"
          block
          size="large"
          style={generateButtonStyle}
          onClick={handleGenerate}
          loading={isLoading}
        >
          {isLoading ? "Styling you..." : "Generate Outfit"}
        </Button>

        {errorMsg && <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>{errorMsg}</p>}
      </div>

      {/* Results Section */}
      {(weatherData || generatedOutfit) && (
        <div style={resultsCardStyle}>
          {weatherData && (
            <div style={weatherSectionStyle}>
              <h3 style={{ fontSize: "18px", marginBottom: "4px" }}>🌤️ Weather Forecast</h3>
              {weatherLocation && (
                <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#444", fontWeight: 500 }}>
                  📍 {weatherLocation}
                </p>
              )}
              <p style={{ margin: 0, color: "#555" }}>
                {weatherData.temperature_avg.toFixed(1)}°C | {weatherData.weather_condition}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                H: {weatherData.temperature_max.toFixed(1)}°C  L: {weatherData.temperature_min.toFixed(1)}°C
              </p>
            </div>
          )}

          {isLoading && !generatedOutfit && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner" style={spinnerStyle}></div>
              <p style={{ marginTop: "16px", color: "#666" }}>Designing your outfit with Vertex AI...</p>
            </div>
          )}

          {generatedOutfit && (
            <div style={outfitSectionStyle}>
              <h3 style={{ fontSize: "22px", marginBottom: "16px" }}>✨ Your Generated Outfit With AI </h3>
              {generatedOutfit.image_url && (
                <img
                  src={`http://localhost:8000${generatedOutfit.image_url}`}
                  alt="Generated Outfit"
                  style={generatedImageStyle}
                />
              )}
              <div style={{ marginTop: "20px", background: "#f9f9f9", padding: "16px", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 8px 0" }}><strong>Top:</strong> {generatedOutfit.top_description}</p>
                <p style={{ margin: 0 }}><strong>Bottom:</strong> {generatedOutfit.bottom_description}</p>
              </div>
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
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  background: "#ffffff",
  padding: "40px",
  borderRadius: "18px",
  width: "660px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
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

const resultsCardStyle = {
  background: "#ffffff",
  padding: "40px",
  borderRadius: "18px",
  width: "660px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  marginLeft: "24px",
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

const outfitSectionStyle = {
  textAlign: "center",
};

const generatedImageStyle = {
  width: "100%",
  maxWidth: "400px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  objectFit: "cover",
  aspectRatio: "1/1",
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #111",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

// Add keyframes inline for spinner hackiness or rely on CSS
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}
