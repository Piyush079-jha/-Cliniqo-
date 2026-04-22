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

  // Fetch fresh user on every app load
  React.useEffect(() => {
    axios.get("https://cliniqo-backend.onrender.com/api/v1/user/me", { withCredentials: true })
      .then(res => { setUser(res.data.user); setIsAuthenticated(true); })
      .catch(() => { setUser({}); setIsAuthenticated(false); });
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
      }}
    >
      <App />
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
