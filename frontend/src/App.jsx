import React, { useContext, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import Home from "./Pages/Home";
import Appointment from "./Pages/Appointment";
import AboutUs from "./Pages/AboutUs";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Doctors from "./Pages/Doctors";
import AllDepartments from "./Pages/AllDepartments";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Context } from "./main";
import DoctorSchedule from "./doctor/DoctorSchedule";
import VideoCall from "./components/VideoCall";
// Admin
import AdminDashboard from "./admin/Dashboard";
import AdminLogin from "./admin/Login";
import AddNewDoctor from "./admin/AddNewDoctor";
import AddNewAdmin from "./admin/AddNewAdmin";
import AdminDoctors from "./admin/Doctors";
import AdminMessages from "./admin/Messages";
import AdminAppointments from "./admin/Appointments";
import AdminSidebar from "./admin/Sidebar";
import ManageAdmins from "./admin/ManageAdmins";
import Reviews from "./admin/Reviews";
// Doctor
import DoctorDashboard from "./doctor/Dashboard";
// Auth
import ResetPassword from "./Pages/ResetPassword";
import ForgotPassword from "./Pages/ForgotPassword";
// Patient
import PatientDashboard from "./Pages/PatientDashboard";

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com";

// ─────────────────────────────────────────────────────────────────────────────
// Layout wrapper
// ─────────────────────────────────────────────────────────────────────────────
const Layout = ({ children }) => {
  const location = useLocation();

  const isAdminRoute    = location.pathname.startsWith("/admin");
  const isAdminLogin    = location.pathname === "/admin/login";
  const isDoctorDashboard =
    location.pathname === "/doctor/dashboard" ||
    location.pathname === "/doctor" ||
    location.pathname === "/doctor/schedule";

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname === "/patient/dashboard";

  // ✅ FIX: match the actual route path /video/:appointmentId
  const isVideoCall = location.pathname.startsWith("/video/");

  if (isAdminRoute && !isAdminLogin) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7f5" }}>
        <AdminSidebar />
        <div style={{ marginLeft: "260px", flex: 1, minHeight: "100vh", overflow: "auto" }}>
          {children}
        </div>
      </div>
    );
  }

  if (isDoctorDashboard) return <>{children}</>;
  if (isVideoCall)       return <>{children}</>;
  if (isAuthPage)        return <>{children}</>;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Inner app — rendered inside Router so useLocation works
// SocketProvider is inside Router so it can use useNavigate
// ─────────────────────────────────────────────────────────────────────────────
const AppInner = () => {
  const {
    setIsAuthenticated, setUser,
    setIsAdminAuthenticated, setAdmin,
    setIsDoctorAuthenticated, setDoctor,
    doctor, user,
  } = useContext(Context);

  // Restore session — only call the endpoint matching the current route
  // This prevents the other two 400 errors showing in DevTools
  useEffect(() => {
    const path = window.location.pathname;

    const isAdminRoute  = path.startsWith("/admin");
    const isDoctorRoute = path.startsWith("/doctor") || path.startsWith("/video");
    // everything else is treated as patient/public

    if (isAdminRoute) {
      axios
        .get(`${BASE}/api/v1/user/admin/me`, { withCredentials: true })
        .then((res) => { setIsAdminAuthenticated(true); setAdmin(res.data.user); })
        .catch((err) => {
          setIsAdminAuthenticated(false);
          setAdmin({});
          if (err?.response?.status !== 400 && err?.response?.status !== 401) {
            console.error("Admin auth error:", err.message);
          }
        });
      return;
    }

    if (isDoctorRoute) {
      axios
        .get(`${BASE}/api/v1/user/doctor/me`, { withCredentials: true })
        .then((res) => { setIsDoctorAuthenticated(true); setDoctor(res.data.user); })
        .catch((err) => {
          setIsDoctorAuthenticated(false);
          setDoctor({});
          if (err?.response?.status !== 400 && err?.response?.status !== 401) {
            console.error("Doctor auth error:", err.message);
          }
        });
      return;
    }

    // Patient / public routes
    axios
      .get(`${BASE}/api/v1/user/patient/me`, { withCredentials: true })
      .then((res) => { setIsAuthenticated(true); setUser(res.data.user); })
      .catch((err) => {
        setIsAuthenticated(false);
        setUser({});
        if (err?.response?.status !== 400 && err?.response?.status !== 401) {
          console.error("Patient auth error:", err.message);
        }
      });
  }, []);

  return (
    // ✅ FIX: SocketProvider wraps everything INSIDE Router (needs useNavigate)
    // but OUTSIDE Routes — so it's always mounted, always listening
    <SocketProvider user={user} doctor={doctor}>
      <Layout>
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/home"        element={<Home />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/about"       element={<AboutUs />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/doctors"     element={<Doctors />} />
          <Route path="/departments" element={<AllDepartments />} />

          {/* Auth flows */}
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin */}
          <Route path="/admin/login"          element={<AdminLogin />} />
          <Route path="/admin"                element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard"      element={<AdminDashboard />} />
          <Route path="/admin/doctors"        element={<AdminDoctors />} />
          <Route path="/admin/messages"       element={<AdminMessages />} />
          <Route path="/admin/appointments"   element={<AdminAppointments />} />
          <Route path="/admin/doctor/addnew"  element={<AddNewDoctor />} />
          <Route path="/admin/addnew"         element={<AddNewAdmin />} />
          <Route path="/admin/manage-admins"  element={<ManageAdmins />} />
          <Route path="/admin/reviews"        element={<Reviews />} />

          {/* Doctor */}
          <Route path="/doctor"           element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/schedule"  element={<DoctorSchedule />} />

          {/* Patient */}
          <Route path="/patient/dashboard" element={<PatientDashboard />} />

          {/* ✅ FIX: Single video call route used by BOTH doctor and patient */}
          {/* Doctor navigates here after startCall API returns roomId         */}
          {/* Patient navigates here from SocketContext after accepting call   */}
          <Route
            path="/video/:appointmentId"
            element={
              <VideoCall
                role={doctor?._id ? "Doctor" : "Patient"}
                userName={
                  doctor?._id
                    ? `Dr. ${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim()
                    : `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                }
              />
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </SocketProvider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const App = () => (
  <Router>
    <AppInner />
    <ToastContainer position="top-center" />
  </Router>
);

export default App;
