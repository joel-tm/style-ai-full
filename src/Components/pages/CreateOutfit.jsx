
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

  const handleGenerate = () => {
    const outfitData = {
      occasion,
      country,
      place,
      date: date ? date.format("YYYY-MM-DD") : null,
    };

    console.log("Generate outfit with:", outfitData);
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
        >
          Generate Outfit
        </Button>
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
