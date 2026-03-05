// import React, { useRef, useState } from "react";

// export default function MyWardrobe() {
//   const fileInputRef = useRef(null);
//   const [images, setImages] = useState([]);

//   const openFileExplorer = () => {
//     fileInputRef.current.click();
//   };

//   const handleUpload = (e) => {
//     const files = Array.from(e.target.files);
//     const newImages = files.map((file) =>
//       URL.createObjectURL(file)
//     );
//     setImages((prev) => [...prev, ...newImages]);
//   };

//   return (
//     <div style={pageStyle}>
//       {/* Heading */}
//       <h1 style={titleStyle}>
//         Build your digital wardrobe
//       </h1>
//       <p style={subtitleStyle}>
//         Upload your clothes and view them like an online store
//       </p>

//       {/* Image Grid */}
//       <div style={gridStyle}>
//         {images.map((img, index) => (
//           <div key={index} style={cardStyle}>
//             <img src={img} alt="wardrobe" style={imageStyle} />
//           </div>
//         ))}
//       </div>

//       {/* Hidden file input */}
//       <input
//         type="file"
//         accept="image/*"
//         multiple
//         ref={fileInputRef}
//         onChange={handleUpload}
//         style={{ display: "none" }}
//       />

//       {/* Floating + button */}
//       <button onClick={openFileExplorer} style={plusButtonStyle}>
//         +
//       </button>
//     </div>
//   );
// }

// /* ---------- Styles ---------- */

// const pageStyle = {
//   minHeight: "100vh",
//   background: "#eeeeee",
//   padding: "40px",
//   fontFamily: "Arial, sans-serif",
//   position: "relative",
// };

// const titleStyle = {
//   fontSize: "36px",
//   fontWeight: "600",
//   color: "#111",
//   marginBottom: "10px",
// };

// const subtitleStyle = {
//   fontSize: "14px",
//   color: "#555",
//   marginBottom: "40px",
// };

// const gridStyle = {
//   display: "grid",
//   gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
//   gap: "24px",
// };

// const cardStyle = {
//   background: "#f7f7f7",
//   borderRadius: "14px",
//   padding: "12px",
//   boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
// };

// const imageStyle = {
//   width: "100%",
//   height: "220px",
//   objectFit: "cover",
//   borderRadius: "10px",
// };

// const plusButtonStyle = {
//   position: "fixed",
//   bottom: "30px",
//   right: "30px",
//   width: "56px",
//   height: "56px",
//   borderRadius: "50%",
//   background: "#111",
//   color: "#fff",
//   fontSize: "32px",
//   border: "none",
//   cursor: "pointer",
//   boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
// };
import React, { useRef, useState, useEffect } from "react";

const CATEGORIES = ["Tops", "Bottoms", "Dresses", "Footwear", "Accessories"];

export default function MyWardrobe() {
  const fileInputRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState("Tops");
  const [wardrobe, setWardrobe] = useState({
    Tops: [],
    Bottoms: [],
    Dresses: [],
    Footwear: [],
    Accessories: [],
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewModes, setViewModes] = useState({}); // { id: 'clean' | 'original' }
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [manualValues, setManualValues] = useState({
    // Category
    type: "",
    neckline: "",
    sleevelength: "",
    // Color Information
    primaryColor: "",
    secondaryColors: "",
    // Fit & Silhouette
    fit: "",
    length: "",
    // Material & Texture
    fabricType: "",
    texture: "",
  });

  const token = localStorage.getItem("token");

  // Fetch wardrobe items from backend on mount
  useEffect(() => {
    if (!token) return;

    fetch("/api/wardrobe", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((items) => {
        const grouped = {
          Tops: [],
          Bottoms: [],
          Dresses: [],
          Footwear: [],
          Accessories: [],
        };
        items.forEach((item) => {
          if (grouped[item.category]) {
            grouped[item.category].push(item);
          }
        });
        setWardrobe(grouped);
      })
      .catch((err) => console.error("Failed to load wardrobe:", err));
  }, []);

  // Clear selections when switching categories
  useEffect(() => {
    setSelectedItems([]);
  }, [activeCategory]);

  const openFileExplorer = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", activeCategory);

      try {
        const res = await fetch("/api/wardrobe", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          console.error("Upload failed");
          continue;
        }

        const item = await res.json();
        setWardrobe((prev) => ({
          ...prev,
          [item.category]: [...prev[item.category], item],
        }));
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    // Reset input so same file can be uploaded again
    e.target.value = "";
  };

  const handleDelete = async (itemId, category) => {
    try {
      const res = await fetch(`/api/wardrobe/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setWardrobe((prev) => ({
          ...prev,
          [category]: prev[category].filter((item) => item.id !== itemId),
        }));
        setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSelect = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleRemoveBackground = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/wardrobe/remove-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item_ids: selectedItems }),
      });

      if (res.ok) {
        const updatedItems = await res.json();

        // Update local state for each updated item
        setWardrobe((prev) => {
          const next = { ...prev };
          const itemsMap = {};
          updatedItems.forEach((u) => {
            itemsMap[u.id] = u;
          });

          next[activeCategory] = next[activeCategory].map((item) =>
            itemsMap[item.id] ? itemsMap[item.id] : item,
          );
          return next;
        });

        // Auto view the clean versions
        setViewModes((prev) => {
          const next = { ...prev };
          updatedItems.forEach((item) => {
            if (item.bg_removed_image_url) {
              next[item.id] = "clean";
            }
          });
          return next;
        });

        setSelectedItems([]); // Clear selection after processing
      } else {
        console.error("Batch processing failed");
      }
    } catch (err) {
      console.error("Batch processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleViewMode = (itemId) => {
    setViewModes((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === "original" ? "clean" : "original",
    }));
  };

  const handleSelectAll = () => {
    const categoryItems = wardrobe[activeCategory];
    if (selectedItems.length === categoryItems.length) {
      // If all already selected, deselect all
      setSelectedItems([]);
    } else {
      // Select all in current category
      setSelectedItems(categoryItems.map((item) => item.id));
    }
  };

  const handleImageAnalysisClick = () => {
    if (selectedItems.length === 0) return;
    setShowAnalysisModal(true);
    setManualValues({
      type: "",
      neckline: "",
      sleevelength: "",
      primaryColor: "",
      secondaryColors: "",
      fit: "",
      length: "",
      fabricType: "",
      texture: "",
    });
  };

  const handleAIAnalysis = async () => {
    setShowAnalysisModal(false);
    await handleRemoveBackground();
  };

  const handleManualAnalysis = async () => {
    if (
      !manualValues.type ||
      !manualValues.primaryColor ||
      !manualValues.fit ||
      !manualValues.fabricType
    ) {
      alert(
        "Please fill in at least Type, Primary Color, Fit, and Fabric Type",
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Send manual analysis data for each selected item
      const promises = selectedItems.map((itemId) =>
        fetch(`/api/wardrobe/${itemId}/image-analysis`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(manualValues),
        }),
      );

      const responses = await Promise.all(promises);
      const allSuccess = responses.every((res) => res.ok);

      if (allSuccess) {
        // Refresh wardrobe data to get updated items with image_analysis
        const refreshRes = await fetch("/api/wardrobe", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (refreshRes.ok) {
          const items = await refreshRes.json();
          const grouped = {
            Tops: [],
            Bottoms: [],
            Dresses: [],
            Footwear: [],
            Accessories: [],
          };
          items.forEach((item) => {
            if (grouped[item.category]) {
              grouped[item.category].push(item);
            }
          });
          setWardrobe(grouped);
        }

        alert(`✓ Image analysis saved for ${selectedItems.length} item(s)!`);
        setShowAnalysisModal(false);
        setSelectedItems([]);
        setManualValues({
          type: "",
          neckline: "",
          sleevelength: "",
          primaryColor: "",
          secondaryColors: "",
          fit: "",
          length: "",
          fabricType: "",
          texture: "",
        });
      } else {
        alert("Failed to save image analysis. Please try again.");
      }
    } catch (err) {
      console.error("Manual analysis error:", err);
      alert("Error saving image analysis: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Heading */}
      <h1 style={titleStyle}>Build your digital wardrobe</h1>
      <p style={subtitleStyle}>
        Upload your clothes and organize them like an online store
      </p>

      {/* Category Buttons */}
      <div style={categoryRowStyle}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              ...categoryButtonStyle,
              backgroundColor: activeCategory === cat ? "#111" : "#e5e5e5",
              color: activeCategory === cat ? "#fff" : "#111",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      <div style={gridStyle}>
        {wardrobe[activeCategory].map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const hasClean = !!item.bg_removed_image_url;
          // default to clean if present and not explicitly toggled away, otherwise original
          const viewMode =
            viewModes[item.id] || (hasClean ? "clean" : "original");
          const displayImage =
            viewMode === "clean" && hasClean
              ? item.bg_removed_image_url
              : item.image_url;

          return (
            <div
              key={item.id}
              style={{
                ...cardStyle,
                border: isSelected ? "2px solid #111" : "2px solid transparent",
              }}
              onClick={() => handleSelect(item.id)}
            >
              <img src={displayImage} alt="wardrobe" style={imageStyle} />

              {/* Checkbox Overlay */}
              <div
                style={{
                  ...checkboxLabelStyle,
                  background: isSelected ? "#111" : "#fff",
                  borderColor: isSelected ? "#111" : "#ccc",
                }}
              >
                {isSelected && (
                  <span style={{ color: "#fff", fontSize: "12px" }}>✓</span>
                )}
              </div>

              {/* Toggle Button */}
              {hasClean && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleViewMode(item.id);
                  }}
                  style={{
                    ...toggleBtnStyle,
                    background: item.image_analysis
                      ? "rgba(240, 240, 240, 0.95)"
                      : "rgba(193, 190, 212, 0.9)",
                  }}
                  title="Toggle original/clean view"
                >
                  {viewMode === "clean" ? "🪄" : "🖼️"}
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id, activeCategory);
                }}
                style={deleteBtnStyle}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={actionsContainerStyle}>
        {selectedItems.length > 0 && (
          <button
            onClick={handleRemoveBackground}
            disabled={isProcessing}
            style={magicButtonStyle}
          >
            {isProcessing
              ? "Processing..."
              : `Remove background (${selectedItems.length})`}
          </button>
        )}

        {/* Floating Image Analysis Icon Button */}
        <button
          onClick={handleImageAnalysisClick}
          disabled={selectedItems.length === 0 || isProcessing}
          style={{
            ...floatingRemoveBgButtonStyle,
            opacity: selectedItems.length === 0 ? 0.5 : 1,
            cursor: selectedItems.length === 0 ? "not-allowed" : "pointer",
          }}
          title="Image analysis on selected items"
        >
          <span style={{ fontSize: "20px", marginRight: "6px" }}></span>
          <span style={{ fontSize: "12px", fontWeight: "600" }}>
            Image Analysis
          </span>
        </button>

        {/* Floating Select All Icon Button */}
        <button
          onClick={handleSelectAll}
          style={{
            ...floatingSelectAllButtonStyle,
          }}
          title={
            selectedItems.length === wardrobe[activeCategory].length
              ? "Deselect all"
              : "Select all items"
          }
        >
          <span style={{ fontSize: "20px", marginRight: "6px" }}>☑️</span>
          <span style={{ fontSize: "12px", fontWeight: "600" }}>
            {selectedItems.length === wardrobe[activeCategory].length
              ? "Deselect All"
              : "Select All"}
          </span>
        </button>

        {/* Floating Plus Button */}
        <button onClick={openFileExplorer} style={plusButtonStyle}>
          +
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleUpload}
        style={{ display: "none" }}
      />

      {/* Image Analysis Modal */}
      {showAnalysisModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h2 style={modalTitleStyle}>Choose Analysis Method</h2>
            <p style={modalDescriptionStyle}>
              Select how you want to analyze the selected {selectedItems.length}{" "}
              item(s)
            </p>

            {/* AI Option */}
            <div style={optionRowStyle}>
              <button
                onClick={handleAIAnalysis}
                disabled={isProcessing}
                style={aiOptionStyle}
              >
                <span style={{ fontSize: "28px", marginBottom: "8px" }}>
                  🤖
                </span>
                <span style={{ fontWeight: "600" }}>Use AI Analysis</span>
                <span
                  style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}
                >
                  Auto-detect category, color, fit, material
                </span>
              </button>
            </div>

            {/* Manual Option */}
            <div style={optionRowStyle}>
              <div style={manualOptionContainerStyle}>
                <h3 style={manualTitleStyle}>📝 Manual Entry</h3>

                {/* Category Section */}
                <div style={sectionHeaderStyle}>Category</div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Type</label>
                  <input
                    type="text"
                    placeholder="e.g., Shirt, Trousers, Blazer, Dress, Sneakers"
                    value={manualValues.type}
                    onChange={(e) =>
                      setManualValues({ ...manualValues, type: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Neckline</label>
                  <input
                    type="text"
                    placeholder="e.g., Crew Neck, V-Neck, Polo, Turtleneck"
                    value={manualValues.neckline}
                    onChange={(e) =>
                      setManualValues({
                        ...manualValues,
                        neckline: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Sleeve Length</label>
                  <input
                    type="text"
                    placeholder="e.g., Short, 3/4, Long, Sleeveless"
                    value={manualValues.sleevelength}
                    onChange={(e) =>
                      setManualValues({
                        ...manualValues,
                        sleevelength: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                {/* Color Information Section */}
                <div style={sectionHeaderStyle}>Color Information</div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Primary Color</label>
                  <input
                    type="text"
                    placeholder="e.g., Red, Blue, Black"
                    value={manualValues.primaryColor}
                    onChange={(e) =>
                      setManualValues({
                        ...manualValues,
                        primaryColor: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Secondary Colors</label>
                  <input
                    type="text"
                    placeholder="e.g., White, Grey (comma-separated)"
                    value={manualValues.secondaryColors}
                    onChange={(e) =>
                      setManualValues({
                        ...manualValues,
                        secondaryColors: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                {/* Fit & Silhouette Section */}
                <div style={sectionHeaderStyle}>Fit & Silhouette</div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Fit</label>
                  <input
                    type="text"
                    placeholder="e.g., Slim, Regular, Oversized"
                    value={manualValues.fit}
                    onChange={(e) =>
                      setManualValues({ ...manualValues, fit: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Length</label>
                  <input
                    type="text"
                    placeholder="e.g., Cropped, Knee-length, Full-length, regular "
                    value={manualValues.length}
                    onChange={(e) =>
                      setManualValues({
                        ...manualValues,
                        length: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                {/* Material & Texture Section */}
                <div style={sectionHeaderStyle}>Material & Texture</div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Fabric Type</label>
                  <input
                    type="text"
                    placeholder="e.g., Cotton, Wool, Denim, Silk, Polyester"
                    value={manualValues.fabricType}
                    onChange={(e) =>
                      setManualValues({
                        ...manualValues,
                        fabricType: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Texture</label>
                  <input
                    type="text"
                    placeholder="e.g., Smooth, Ribbed, Chunky, Flowy"
                    value={manualValues.texture}
                    onChange={(e) =>
                      setManualValues({
                        ...manualValues,
                        texture: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <button
                  onClick={handleManualAnalysis}
                  style={submitManualButtonStyle}
                >
                  Submit
                </button>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowAnalysisModal(false)}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */

const pageStyle = {
  minHeight: "100vh",
  background: "#eeeeee",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
  position: "relative",
};

const titleStyle = {
  fontSize: "36px",
  fontWeight: "600",
  color: "#111",
  marginBottom: "10px",
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#555",
  marginBottom: "30px",
};

const categoryRowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "36px",
  flexWrap: "wrap",
};

const categoryButtonStyle = {
  padding: "8px 18px",
  borderRadius: "20px",
  border: "none",
  fontSize: "14px",
  cursor: "pointer",
  transition: "0.2s ease",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "24px",
};

const cardStyle = {
  background: "#f7f7f7",
  borderRadius: "14px",
  padding: "12px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  position: "relative",
};

const deleteBtnStyle = {
  position: "absolute",
  top: "16px",
  right: "16px",
  background: "rgba(0, 0, 0, 0.6)",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "28px",
  height: "28px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "18px",
  lineHeight: "1",
};

const imageStyle = {
  width: "100%",
  height: "220px",
  objectFit: "contain",
  borderRadius: "10px",
};

const checkboxLabelStyle = {
  position: "absolute",
  top: "16px",
  left: "16px",
  width: "20px",
  height: "20px",
  borderRadius: "4px",
  border: "2px solid #ccc",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const toggleBtnStyle = {
  position: "absolute",
  bottom: "16px",
  right: "16px",
  background: "rgba(255, 255, 255, 0.9)",
  border: "none",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "18px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};

const actionsContainerStyle = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "15px",
};

const magicButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "10px 16px",
  borderRadius: "30px",
  background: "linear-gradient(135deg, #FF6B6B, #556270)",
  color: "#fff",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(255, 107, 107, 0.4)",
  transition: "all 0.3s ease",
  whiteSpace: "nowrap",
};

const plusButtonStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  background: "#111",
  color: "#fff",
  fontSize: "32px",
  border: "none",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
};
const floatingRemoveBgButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "10px 16px",
  borderRadius: "30px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
  transition: "all 0.3s ease",
  whiteSpace: "nowrap",
};

const floatingSelectAllButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "10px 16px",
  borderRadius: "30px",
  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  color: "#fff",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(245, 87, 108, 0.4)",
  transition: "all 0.3s ease",
  whiteSpace: "nowrap",
};

/* Modal Styles */
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalBoxStyle = {
  background: "#fff",
  borderRadius: "16px",
  padding: "32px",
  maxWidth: "600px",
  width: "90%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
};

const modalTitleStyle = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#111",
  marginBottom: "8px",
};

const modalDescriptionStyle = {
  fontSize: "14px",
  color: "#666",
  marginBottom: "24px",
};

const optionRowStyle = {
  marginBottom: "20px",
};

const aiOptionStyle = {
  width: "100%",
  padding: "24px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  border: "none",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "transform 0.2s ease, opacity 0.2s ease",
};

const manualOptionContainerStyle = {
  background: "#f7f7f7",
  borderRadius: "12px",
  padding: "20px",
  border: "2px solid #e5e5e5",
};

const manualTitleStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111",
  marginBottom: "16px",
};

const sectionHeaderStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#111",
  marginTop: "16px",
  marginBottom: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputGroupStyle = {
  marginBottom: "16px",
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#666",
  marginBottom: "6px",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  fontFamily: "Arial, sans-serif",
  transition: "border-color 0.2s ease",
};

const submitManualButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  background: "#111",
  color: "#fff",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "12px",
  transition: "background 0.2s ease",
};

const cancelButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  background: "#e5e5e5",
  color: "#111",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "16px",
  transition: "background 0.2s ease",
};
