import React, { createContext, useState } from "react";
import axios from "axios";
import ReactDOM from "react-dom/client";
import App from "./App";

export const Context = createContext({
  isAuthenticated: false,
  isAdminAuthenticated: false,
  isDoctorAuthenticated: false,
});

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated]           = useState(false);
  const [user, setUser]                                 = useState({});
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [admin, setAdmin]                               = useState({});
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(false);
  const [doctor, setDoctor]                             = useState({});
  const [loading, setLoading]                           = useState(true);

  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) {
      axios.get("https://cliniqo-backend.onrender.com/api/v1/user/admin/me", { withCredentials: true })
        .then(res => { setAdmin(res.data.user); setIsAdminAuthenticated(true); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (path.startsWith("/doctor")) {
      axios.get("https://cliniqo-backend.onrender.com/api/v1/user/doctor/me", { withCredentials: true })
        .then(res => { setDoctor(res.data.user); setIsDoctorAuthenticated(true); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      axios.get("https://cliniqo-backend.onrender.com/api/v1/user/patient/me", { withCredentials: true })
        .then(res => { setUser(res.data.user); setIsAuthenticated(true); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <Context.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        admin,
        setAdmin,
        isDoctorAuthenticated,
        setIsDoctorAuthenticated,
        doctor,
        setDoctor,
        loading,
      }}
    >
      {loading ? (
        <div style={{
          position: "fixed", inset: 0,
          background: "linear-gradient(155deg, #061a10 0%, #0b3324 50%, #103d2c 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, overflow: "hidden",
        }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Outfit:wght@400;600&display=swap');
            @keyframes rotateCube {
              0%   { transform: rotateX(0deg) rotateY(0deg); }
              100% { transform: rotateX(360deg) rotateY(360deg); }
            }
            @keyframes pulse3d {
              0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4), 0 20px 60px rgba(0,0,0,0.5); }
              50%     { box-shadow: 0 0 0 20px rgba(201,168,76,0), 0 20px 60px rgba(0,0,0,0.5); }
            }
            @keyframes floatLogo {
              0%,100% { transform: translateY(0px); }
              50%     { transform: translateY(-10px); }
            }
            @keyframes shimmerGold {
              0%   { background-position: -200% center; }
              100% { background-position:  200% center; }
            }
            @keyframes gridMove {
              0%   { transform: translateY(0); }
              100% { transform: translateY(44px); }
            }
            @keyframes dotPulse {
              0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
              40%          { transform: scale(1);   opacity: 1; }
            }
            @keyframes ringExpand {
              0%   { transform: scale(0.8); opacity: 0.6; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          `}</style>

          {/* Animated grid background */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
            animation: "gridMove 3s linear infinite",
          }} />

          {/* Orbs */}
          <div style={{ position:"absolute", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(45,106,82,.2) 0%,transparent 65%)", top:"-100px", right:"-100px", pointerEvents:"none" }} />
          <div style={{ position:"absolute", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,.08) 0%,transparent 65%)", bottom:"-50px", left:"-80px", pointerEvents:"none" }} />

          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>

            {/* 3D rotating cube behind logo */}
            <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 28px", perspective: "300px" }}>
              <div style={{
                width: "80px", height: "80px",
                border: "1.5px solid rgba(201,168,76,0.5)",
                borderRadius: "18px",
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                animation: "rotateCube 4s linear infinite",
                transformStyle: "preserve-3d",
                background: "rgba(201,168,76,0.05)",
                boxShadow: "inset 0 0 20px rgba(201,168,76,0.1)",
              }} />
              <div style={{
                width: "60px", height: "60px",
                border: "1px solid rgba(26,102,68,0.6)",
                borderRadius: "14px",
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                animation: "rotateCube 3s linear infinite reverse",
                transformStyle: "preserve-3d",
              }} />
              {/* Pulsing ring */}
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                border: "1px solid rgba(201,168,76,0.3)",
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                animation: "ringExpand 2s ease-out infinite",
              }} />
              {/* Hospital icon */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                fontSize: "32px",
                animation: "floatLogo 3s ease-in-out infinite",
                filter: "drop-shadow(0 4px 12px rgba(201,168,76,0.4))",
              }}>🏥</div>
            </div>

            {/* Logo */}
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "48px", fontWeight: 700,
              letterSpacing: "-0.5px", marginBottom: "6px",
              background: "linear-gradient(90deg, #ffffff 0%, #e8cc80 50%, #ffffff 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmerGold 3s linear infinite",
            }}>
              Clini<span style={{ fontStyle: "italic" }}>qo</span>
            </div>

            {/* Tagline */}
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "12px", fontWeight: 600,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "3px", textTransform: "uppercase",
              marginBottom: "32px",
            }}>
              Hospital Management System
            </div>

            {/* Dot loader */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #1a6644, #c9a84c)",
                  animation: `dotPulse 1.4s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </div>
          </div>
        </div>
      ) : <App />}
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
