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
        : [...prev, itemId]
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
          updatedItems.forEach((u) => { itemsMap[u.id] = u; });

          next[activeCategory] = next[activeCategory].map((item) =>
            itemsMap[item.id] ? itemsMap[item.id] : item
          );
          return next;
        });

        // Auto view the clean versions
        setViewModes((prev) => {
          const next = { ...prev };
          updatedItems.forEach(item => {
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
      [itemId]: prev[itemId] === "original" ? "clean" : "original"
    }));
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
              backgroundColor:
                activeCategory === cat ? "#111" : "#e5e5e5",
              color:
                activeCategory === cat ? "#fff" : "#111",
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
          const viewMode = viewModes[item.id] || (hasClean ? "clean" : "original");
          const displayImage = viewMode === "clean" && hasClean ? item.bg_removed_image_url : item.image_url;

          return (
            <div key={item.id} style={{ ...cardStyle, border: isSelected ? "2px solid #111" : "2px solid transparent" }} onClick={() => handleSelect(item.id)}>
              <img src={displayImage} alt="wardrobe" style={imageStyle} />

              {/* Checkbox Overlay */}
              <div
                style={{
                  ...checkboxLabelStyle,
                  background: isSelected ? "#111" : "#fff",
                  borderColor: isSelected ? "#111" : "#ccc"
                }}
              >
                {isSelected && <span style={{ color: "#fff", fontSize: "12px" }}>✓</span>}
              </div>

              {/* Toggle Button */}
              {hasClean && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleViewMode(item.id);
                  }}
                  style={toggleBtnStyle}
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
            {isProcessing ? "Processing..." : `Remove background (${selectedItems.length})`}
          </button>
        )}

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
  padding: "14px 24px",
  borderRadius: "30px",
  background: "linear-gradient(135deg, #FF6B6B, #556270)",
  color: "#fff",
  border: "none",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
  transition: "0.2s ease",
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
