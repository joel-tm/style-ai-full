
// import React, { useState } from "react";
// const navigate = useNavigate();
// export default function Profession() {
//   const [professions] = useState([
//     "Student",
//     "Developer",
//     "Designer",
//     "Engineer",
//     "Entrepreneur",
//   ]);

//   const [selected, setSelected] = useState("");
//   const [customProfession, setCustomProfession] = useState("");

//   const handleContinue = () => {
//     const chosenProfession = customProfession.trim() || selected;
//    if (chosenProfession) {
//     localStorage.setItem("profession", chosenProfession);
//   }

//   // always navigate
//   navigate("/home");
//   };

//   return (
//     <div style={pageStyle}>
//       <div style={cardStyle}>
//         <h2 style={titleStyle}>Which profession describes you?</h2>
//         <p style={subTitleStyle}>
//           Select from the list or add your own
//         </p>

//         {/* Profession buttons */}
//         {professions.map((profession, index) => (
//           <button
//             key={index}
//             onClick={() => setSelected(profession)}
//             style={{
//               ...buttonStyle,
//               background:
//                 selected === profession ? "#333" : "#fafafa",
//               color: selected === profession ? "#fff" : "#333",
//               border:
//                 selected === profession
//                   ? "1px solid #333"
//                   : "1px solid #ddd",
//             }}
//           >
//             {profession}
//           </button>
//         ))}

//         <p style={{ margin: "20px 0 10px", color: "#555" }}>Or add your own:</p>
//         <input
//           type="text"
//           placeholder="Enter your profession"
//           value={customProfession}
//           onChange={(e) => setCustomProfession(e.target.value)}
//           style={inputStyle}
//         />

//         <button onClick={handleContinue} style={continueButtonStyle}>
//           Continue
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ---------- Styles ---------- */
// const pageStyle = {
//   minHeight: "100vh",
//   background: "linear-gradient(135deg, #e0e0e0, #f5f5f5)",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   fontFamily: "Arial, sans-serif",
// };

// const cardStyle = {
//   background: "#ffffff",
//   padding: "40px 50px",
//   borderRadius: "16px",
//   boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
//   textAlign: "center",
//   maxWidth: "420px",
//   width: "90%",
// };

// const titleStyle = {
//   marginBottom: "12px",
//   fontSize: "26px",
//   fontWeight: "600",
//   color: "#333",
// };

// const subTitleStyle = {
//   marginBottom: "30px",
//   fontSize: "14px",
//   color: "#777",
// };

// const buttonStyle = {
//   display: "block",
//   width: "100%",
//   padding: "12px",
//   marginBottom: "12px",
//   borderRadius: "10px",
//   cursor: "pointer",
//   fontSize: "15px",
//   transition: "all 0.2s ease",
// };

// const inputStyle = {
//   width: "100%",
//   padding: "12px",
//   borderRadius: "8px",
//   border: "1px solid #ccc",
//   marginBottom: "20px",
//   fontSize: "14px",
// };

// const continueButtonStyle = {
//   width: "100%",
//   padding: "12px",
//   borderRadius: "8px",
//   border: "none",
//   background: "#333",
//   color: "#fff",
//   cursor: "pointer",
//   fontSize: "16px",
// };
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profession() {
  const navigate = useNavigate(); // ✅ INSIDE component

  const [professions] = useState([
    "Student",
    "Developer",
    "Designer",
    "Engineer",
    "Entrepreneur",
  ]);

  const [selected, setSelected] = useState("");
  const [customProfession, setCustomProfession] = useState("");

  const handleContinue = () => {
    const chosenProfession = customProfession.trim() || selected;

    if (chosenProfession) {
      localStorage.setItem("profession", chosenProfession);
    }

    navigate("/home"); // ✅ smooth navigation
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Which profession describes you?</h2>
        <p style={subTitleStyle}>
          Select from the list or add your own
        </p>

        {professions.map((profession, index) => (
          <button
            key={index}
            onClick={() => setSelected(profession)}
            style={{
              ...buttonStyle,
              background:
                selected === profession ? "#333" : "#fafafa",
              color: selected === profession ? "#fff" : "#333",
              border:
                selected === profession
                  ? "1px solid #333"
                  : "1px solid #ddd",
            }}
          >
            {profession}
          </button>
        ))}

        <p style={{ margin: "20px 0 10px", color: "#555" }}>
          Or add your own:
        </p>

        <input
          type="text"
          placeholder="Enter your profession"
          value={customProfession}
          onChange={(e) => setCustomProfession(e.target.value)}
          style={inputStyle}
        />

        <button onClick={handleContinue} style={continueButtonStyle}>
          Continue
        </button>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e0e0e0, #f5f5f5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  background: "#ffffff",
  padding: "40px 50px",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  textAlign: "center",
  maxWidth: "420px",
  width: "90%",
};

const titleStyle = {
  marginBottom: "12px",
  fontSize: "26px",
  fontWeight: "600",
  color: "#333",
};

const subTitleStyle = {
  marginBottom: "30px",
  fontSize: "14px",
  color: "#777",
};

const buttonStyle = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  marginBottom: "20px",
  fontSize: "14px",
};

const continueButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#333",
  color: "#fff",
  cursor: "pointer",
  fontSize: "16px",
};
