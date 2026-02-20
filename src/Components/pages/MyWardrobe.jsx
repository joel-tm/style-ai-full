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
import React, { useRef, useState } from "react";

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

  const openFileExplorer = () => {
    fileInputRef.current.click();
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) =>
      URL.createObjectURL(file)
    );

    setWardrobe((prev) => ({
      ...prev,
      [activeCategory]: [...prev[activeCategory], ...newImages],
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
        {wardrobe[activeCategory].map((img, index) => (
          <div key={index} style={cardStyle}>
            <img src={img} alt="wardrobe" style={imageStyle} />
          </div>
        ))}
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

      {/* Floating Plus Button */}
      <button onClick={openFileExplorer} style={plusButtonStyle}>
        +
      </button>
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
};

const imageStyle = {
  width: "100%",
  height: "220px",
  objectFit: "cover",
  borderRadius: "10px",
};

const plusButtonStyle = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
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
