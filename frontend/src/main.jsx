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
      {loading ? null : <App />}
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
