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

  // Fetch fresh user on every app load
  React.useEffect(() => {
    axios.get("https://cliniqo-backend.onrender.com/api/v1/user/patient/me", { withCredentials: true })
      .then(res => { setUser(res.data.user); setIsAuthenticated(true); })
      .catch(() => { setUser({}); setIsAuthenticated(false); })
      .finally(() => setLoading(false));
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
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:"16px",fontFamily:"Outfit,sans-serif"}}>
          <div style={{width:"44px",height:"44px",border:"4px solid #e0ece5",borderTop:"4px solid #1a3d2e",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{color:"#486057",fontSize:"15px"}}>Starting up, please wait…</p>
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
