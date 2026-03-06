import React, { useCallback, useState } from "react";
import { EnvironmentOutlined, StarFilled } from "@ant-design/icons";

export default function TextileShopFinder({ isOpen, onClose }) {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const fetchNearbyShops = useCallback(
    async (locationOverride) => {
      const token = localStorage.getItem("token");
      const nextLocation = (locationOverride ?? searchLocation).trim();

      if (!token) {
        setError(
          "You need to be logged in to search for nearby textile shops.",
        );
        return;
      }

      if (!nextLocation) {
        setError("Enter a location to search for nearby textile shops.");
        return;
      }

      setIsLoading(true);
      setError("");
      setLocationLabel(`Searching for textile shops near ${nextLocation}...`);

      try {
        const response = await fetch("/api/textile-shops/nearby", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            location_query: nextLocation,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load nearby textile shops.",
          );
        }

        setShops(Array.isArray(data.shops) ? data.shops : []);
        setLocationLabel(`Showing textile shops near ${nextLocation}.`);
      } catch (fetchError) {
        const message =
          fetchError?.message || "Unable to load nearby textile shops.";
        setError(message);
        setLocationLabel("");
        setShops([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchLocation],
  );

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchNearbyShops();
  };

  const openDirections = (shop) => {
    const destination =
      typeof shop.latitude === "number" && typeof shop.longitude === "number"
        ? `${shop.latitude},${shop.longitude}`
        : encodeURIComponent(shop.address);

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <h2 style={panelTitleStyle}>Nearby Textile Shops</h2>
          <p style={panelSubtitleStyle}>
            {locationLabel ||
              "Enter a city, area, or full address to find nearby textile shops."}
          </p>
        </div>

        <div style={panelActionsStyle}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => fetchNearbyShops()}
          >
            Refresh
          </button>
          <button type="button" style={closeButtonStyle} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <form style={searchFormStyle} onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchLocation}
          onChange={(event) => setSearchLocation(event.target.value)}
          placeholder="Enter a location, for example kochi or kerala"
          style={searchInputStyle}
        />
        <button type="submit" style={searchButtonStyle}>
          Search
        </button>
      </form>

      {isLoading && <p style={statusTextStyle}>Loading nearby shops...</p>}
      {error && <p style={errorTextStyle}>{error}</p>}

      {!isLoading && !error && shops.length === 0 && (
        <p style={statusTextStyle}>
          Search for a location to see textile shops.
        </p>
      )}

      {shops.length > 0 && (
        <div style={resultsGridStyle}>
          {shops.map((shop) => (
            <article key={`${shop.name}-${shop.address}`} style={shopCardStyle}>
              <div style={shopHeaderStyle}>
                <h3 style={shopNameStyle}>{shop.name}</h3>
                <button
                  type="button"
                  style={directionsButtonStyle}
                  onClick={() => openDirections(shop)}
                  title="Open directions"
                >
                  <EnvironmentOutlined />
                </button>
              </div>
              <p style={shopAddressStyle}>{shop.address}</p>
              {typeof shop.rating === "number" && (
                <div style={ratingRowStyle}>
                  <StarFilled style={ratingIconStyle} />
                  <span style={ratingTextStyle}>
                    {shop.rating.toFixed(1)}
                    {typeof shop.user_rating_count === "number"
                      ? ` (${shop.user_rating_count} reviews)`
                      : ""}
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const panelStyle = {
  width: "min(960px, 100%)",
  marginTop: "32px",
  padding: "28px",
  borderRadius: "24px",
  background: "linear-gradient(135deg, #fff8ee 0%, #ffffff 100%)",
  border: "1px solid #e4d5c5",
  boxShadow: "0 18px 40px rgba(44, 30, 18, 0.08)",
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

const panelTitleStyle = {
  margin: 0,
  fontSize: "28px",
  color: "#22170f",
};

const panelSubtitleStyle = {
  margin: "8px 0 0",
  fontSize: "14px",
  color: "#725c4a",
};

const panelActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const searchFormStyle = {
  marginTop: "22px",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const searchInputStyle = {
  flex: "1 1 340px",
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid #d7c4b0",
  padding: "0 18px",
  fontSize: "15px",
  color: "#22170f",
  background: "#fff",
};

const sharedButtonStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "10px 18px",
  fontSize: "14px",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...sharedButtonStyle,
  background: "#22170f",
  color: "#fff",
};

const searchButtonStyle = {
  ...sharedButtonStyle,
  minHeight: "46px",
  background: "#b45309",
  color: "#fff",
  padding: "0 22px",
};

const closeButtonStyle = {
  ...sharedButtonStyle,
  background: "#efe2d5",
  color: "#4d3725",
};

const statusTextStyle = {
  marginTop: "20px",
  marginBottom: 0,
  color: "#4d3725",
  fontSize: "15px",
};

const errorTextStyle = {
  marginTop: "20px",
  marginBottom: 0,
  color: "#b42318",
  fontSize: "15px",
};

const resultsGridStyle = {
  marginTop: "24px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const shopCardStyle = {
  minHeight: "140px",
  padding: "20px",
  borderRadius: "18px",
  background: "#fff",
  border: "1px solid #eadbcc",
  boxShadow: "0 8px 20px rgba(44, 30, 18, 0.06)",
};

const shopHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const shopNameStyle = {
  margin: 0,
  fontSize: "18px",
  color: "#22170f",
  flex: 1,
};

const shopAddressStyle = {
  margin: "10px 0 0",
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#725c4a",
};

const directionsButtonStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  border: "none",
  background: "#22170f",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const ratingRowStyle = {
  marginTop: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const ratingIconStyle = {
  color: "#d97706",
};

const ratingTextStyle = {
  fontSize: "14px",
  color: "#4d3725",
};
