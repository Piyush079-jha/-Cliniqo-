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
          background: "#f4f6f4",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "42px", fontWeight: 700,
              color: "#0b3324", letterSpacing: "-0.5px",
            }}>
              Clini<span style={{ color: "#c9a84c", fontStyle: "italic" }}>qo</span>
            </div>
            <div style={{
              width: "40px", height: "3px", borderRadius: "999px",
              background: "linear-gradient(90deg, #1a6644, #c9a84c)",
              margin: "12px auto 0",
              animation: "loadBar 1.2s ease-in-out infinite alternate",
            }} />
          </div>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&display=swap');
            @keyframes loadBar {
              from { transform: scaleX(0.3); opacity: 0.5; }
              to   { transform: scaleX(1);   opacity: 1; }
            }
          `}</style>
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
