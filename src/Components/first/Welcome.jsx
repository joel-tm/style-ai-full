import React from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "black",
      fontFamily: "Arial, sans-serif",
      margin: 0,
      paddingTop: "30px",
    }}
  >



    {/* Main Content */}
    <div
      style={{
        backgroundColor: "black",
        padding: "60px 80px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "70px",
          fontWeight: "700",
          color: "white",
          marginBottom: "15px",
        }}
      >
        Dress with Confidence!
      </h1>

      <p
        style={{
          fontSize: "18px",
          color: "#666666",
          marginBottom: "35px",
        }}
      >
        Your personal AI stylist is here to elevate your fashion game.
      </p>

      <button
        onClick={() => navigate("/Register")}
        style={{
          backgroundColor: "black",
          color: "#ffffff",
          border: "2px solid white",
          padding: "14px 40px",
          fontSize: "18px",
          borderRadius: "70px",
          cursor: "pointer",
        }}
      >
        Get Started
      </button>
    </div>
    <div
  style={{
    width: "310px",
    height: "520px",
    borderRadius: "36px",
    backgroundColor: "black",
    border: "2px solid #333",
    padding: "16px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
  {/* Screen */}
  <div
    style={{
      width: "100%",
      height: "100%",
      borderRadius: "28px",
      backgroundColor: "#f1eded",
      display: "flex",
      justifyContent: "center",
      // alignItems: "center",
    }}
  >
    <h2
      style={{
        color: "black",
        fontWeight: "600",
        fontSize: "26px",
        textAlign: "center",
        lineHeight: "1.4",
      }}
    >
      What should I<br />wear for a meeting? Tell me an outfit 
    </h2>
  </div>
</div>
<h1 style={{ color: "white", fontWeight: "400", lineHeight: "1.4",marginTop:"40px", fontSize:"24px" }}> 
  <strong>Style AI</strong> knows exactly what you want to wear ✨  
  <br />
  Styling you for <strong>meetings 💼</strong>,  
  <strong>date nights 🌙</strong>, and  
  <strong>every moment that matters 👗</strong>
 </h1> 


  </div>
);
}
