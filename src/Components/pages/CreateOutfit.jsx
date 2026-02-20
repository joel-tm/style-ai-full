
import React, { useState, useMemo } from "react";
import { Input, Select, Button } from "antd";
import { Country, City } from "country-state-city";
import "antd/dist/reset.css";

const { Option } = Select;

export default function CreateOutfit() {
  const [occasion, setOccasion] = useState("");
  const [country, setCountry] = useState(null);
  const [place, setPlace] = useState("");
  
 
  const cities = useMemo(() => {
    if (!country) return [];
    const allCities = City.getCitiesOfCountry(country);
    const seen = new Set();

    return allCities.filter((city) => {
      if (seen.has(city.name)) return false;
      seen.add(city.name);
      return true;
    });
  }, [country]);

  const handleGenerate = () => {
    const outfitData = {
      occasion,
      country,
      place,
    
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
            {Country.getAllCountries().map((c) => (
              <Option key={c.isoCode} value={c.isoCode}>
                {c.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* City */}
        <div style={fieldStyle}>
          <label style={labelStyle}>City</label>
          <Select
            placeholder="Select city"
            value={place}
            onChange={(value) => setPlace(value)}
            style={{ width: "100%" }}
            disabled={!country}
            showSearch
            optionFilterProp="children"
            getPopupContainer={(node) => node.parentNode}
          >
            {cities.map((city) => (
              <Option
                key={`${city.name}-${city.latitude}-${city.longitude}`}
                value={city.name}
              >
                {city.name}
              </Option>
            ))}
          </Select>
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
