import React, { useContext, useState } from "react";
import { Context } from "../main";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaTachometerAlt, FaCalendarAlt, FaUserInjured,
  FaPrescriptionBottleAlt, FaCalendarCheck, FaEnvelope,
  FaUserMd, FaSignOutAlt,
} from "react-icons/fa";

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";

const DoctorSidebar = () => {
  const { setIsDoctorAuthenticated, setDoctor, doctor } = useContext(Context);
  const navigate  = useNavigate();
  const location  = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await axios.get(`${BASE}/api/v1/user/doctor/logout`, { withCredentials: true });
      setIsDoctorAuthenticated(false);
      setDoctor(null);
      navigate("/login");
    } catch {
      setIsDoctorAuthenticated(false);
      setDoctor(null);
      navigate("/login");
    } finally { setLoggingOut(false); }
  };

  const navItems = [
    { path: "/doctor/dashboard",     icon: <FaTachometerAlt />, label: "Dashboard"      },
    { path: "/doctor/appointments",  icon: <FaCalendarAlt />,   label: "Appointments"   },
    { path: "/doctor/patients",      icon: <FaUserInjured />,   label: "My Patients"    },
    { path: "/doctor/prescriptions", icon: <FaPrescriptionBottleAlt />, label: "Prescriptions" },
    { path: "/doctor/schedule",      icon: <FaCalendarCheck />, label: "My Schedule"    },
    { path: "/doctor/messages",      icon: <FaEnvelope />,      label: "Messages"       },
    { path: "/doctor/profile",       icon: <FaUserMd />,        label: "My Profile"     },
  ];

  const initials = `${doctor?.firstName?.[0] || "D"}${doctor?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');

        @keyframes ds-slideIn { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ds-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes ds-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.45)} }
        @keyframes ds-itemIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }

        .ds-sidebar {
          width: 252px; min-width: 252px;
          background: #ffffff;
          min-height: 100vh; height: 100vh;
          display: flex; flex-direction: column;
          font-family: 'Inter', sans-serif;
          position: sticky; top: 0;
          overflow-y: auto;
          border-right: 1px solid #eef2f7;
          box-shadow: 2px 0 20px rgba(15,23,42,.04);
          animation: ds-slideIn .38s cubic-bezier(.22,1,.36,1) both;
          z-index: 50;
        }
        .ds-sidebar::-webkit-scrollbar { width: 0; }

        .ds-brand {
          padding: 20px 18px 16px;
          border-bottom: 1px solid #f4f6f9;
          display: flex; align-items: center; gap: 10px;
        }
        .ds-brand-mark {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(59,130,246,.28);
          color: white; font-size: 15px;
        }
        .ds-brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 18px; font-weight: 800;
          color: #0f172a; letter-spacing: -.4px; line-height: 1;
        }
        .ds-brand-name span { color: #3b82f6; }
        .ds-brand-tag {
          font-size: 9px; font-weight: 600;
          letter-spacing: 1.4px; text-transform: uppercase;
          color: #94a3b8; margin-top: 2px;
        }

        .ds-profile {
          margin: 14px 13px 6px;
          background: linear-gradient(135deg, #f0f7ff, #e8f3ff);
          border: 1px solid #dbeafe;
          border-radius: 13px; padding: 13px 14px;
          animation: ds-fadeIn .4s .12s both;
        }
        .ds-profile-row { display: flex; align-items: center; gap: 10px; }
        .ds-avatar {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 13px; font-weight: 700;
          flex-shrink: 0; letter-spacing: -.5px;
          box-shadow: 0 3px 10px rgba(59,130,246,.22);
        }
        .ds-doc-name {
          font-size: 13px; font-weight: 600; color: #0f172a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
        }
        .ds-doc-dept { font-size: 11px; color: #64748b; margin-top: 1px; }
        .ds-status {
          display: flex; align-items: center; gap: 5px;
          margin-top: 9px; font-size: 10.5px; font-weight: 600; color: #16a34a;
        }
        .ds-status-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
          animation: ds-breathe 2.2s ease-in-out infinite;
        }

        .ds-section-lbl {
          font-size: 9px; font-weight: 700; letter-spacing: 1.6px;
          text-transform: uppercase; color: #cbd5e1;
          padding: 14px 20px 6px;
        }
        .ds-nav { padding: 0 10px; flex: 1; }

        .ds-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500; color: #64748b;
          cursor: pointer;
          transition: all .18s cubic-bezier(.22,1,.36,1);
          margin-bottom: 1px;
          border: 1px solid transparent; background: none;
          width: 100%; text-align: left;
          font-family: 'Inter', sans-serif;
          position: relative;
        }
        .ds-nav-item:nth-child(1){animation:ds-itemIn .35s .08s both}
        .ds-nav-item:nth-child(2){animation:ds-itemIn .35s .11s both}
        .ds-nav-item:nth-child(3){animation:ds-itemIn .35s .14s both}
        .ds-nav-item:nth-child(4){animation:ds-itemIn .35s .17s both}
        .ds-nav-item:nth-child(5){animation:ds-itemIn .35s .20s both}
        .ds-nav-item:nth-child(6){animation:ds-itemIn .35s .23s both}
        .ds-nav-item:nth-child(7){animation:ds-itemIn .35s .26s both}

        .ds-nav-item:hover { background:#f8fafc; color:#1e293b; transform:translateX(2px); }
        .ds-nav-item.ds-active {
          background:#eff6ff; color:#1d4ed8;
          font-weight:600; border-color:#dbeafe;
        }
        .ds-nav-item.ds-active .ds-icon-wrap { background:#dbeafe; color:#2563eb; }

        .ds-icon-wrap {
          width:30px; height:30px; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; color:#94a3b8; background:transparent;
          flex-shrink:0; transition:all .18s;
        }
        .ds-nav-item:hover .ds-icon-wrap { background:#f1f5f9; color:#475569; }
        .ds-pip {
          position:absolute; right:0; top:22%; bottom:22%;
          width:3px; background:#3b82f6; border-radius:3px 0 0 3px;
        }

        .ds-logout-wrap {
          padding: 10px 10px 18px;
          margin-top: auto;
          border-top: 1px solid #f4f6f9;
        }
        .ds-logout {
          display:flex; align-items:center; gap:10px;
          width:100%; padding:9px 12px; border-radius:10px;
          font-size:13.5px; font-weight:600; color:#ef4444;
          background:#fef2f2; border:1px solid #fecaca;
          cursor:pointer; transition:all .18s;
          font-family:'Inter',sans-serif;
        }
        .ds-logout:hover { background:#fee2e2; border-color:#fca5a5; transform:translateX(2px); }
        .ds-logout:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .ds-logout-icon {
          width:30px; height:30px; border-radius:8px;
          background:#fee2e2; display:flex; align-items:center; justify-content:center;
          font-size:12px; flex-shrink:0;
        }
        .ds-logout:hover .ds-logout-icon { background:#fecaca; }
      `}</style>

      <aside className="ds-sidebar">

        {/* Brand */}
        <div className="ds-brand">
          <div className="ds-brand-mark">🩺</div>
          <div>
            <div className="ds-brand-name">Clini<span>qo</span></div>
            <div className="ds-brand-tag">Doctor Portal</div>
          </div>
        </div>

        {/* Profile */}
        <div className="ds-profile">
          <div className="ds-profile-row">
            <div className="ds-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="ds-doc-name">Dr. {doctor?.firstName || "Doctor"} {doctor?.lastName || ""}</div>
              <div className="ds-doc-dept">{doctor?.doctorDepartment || "Department"}</div>
            </div>
          </div>
          <div className="ds-status">
            <span className="ds-status-dot" />
            Available for Appointments
          </div>
        </div>

        {/* Nav */}
        <div className="ds-section-lbl">Navigation</div>
        <nav className="ds-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`ds-nav-item${isActive ? " ds-active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="ds-icon-wrap">{item.icon}</span>
                {item.label}
                {isActive && <span className="ds-pip" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="ds-logout-wrap">
          <button className="ds-logout" onClick={handleLogout} disabled={loggingOut}>
            <span className="ds-logout-icon"><FaSignOutAlt /></span>
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>

      </aside>
    </>
  );
};

export default DoctorSidebar;
