import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TiHome } from "react-icons/ti";
import { FaUserMd, FaCalendarAlt, FaEnvelope, FaUserShield, FaStar } from "react-icons/fa";
import { IoPersonAdd } from "react-icons/io5";
import { RiLogoutBoxFill, RiAdminFill } from "react-icons/ri";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";

const Sidebar = () => {
  const { isAdminAuthenticated, setIsAdminAuthenticated, admin } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isAdminAuthenticated) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await axios.get("http://localhost:5000/api/v1/user/admin/logout", { withCredentials: true });
      toast.success(res.data.message);
      setIsAdminAuthenticated(false);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Logout failed");
    } finally { setLoggingOut(false); }
  };

  const navItems = [
    { icon: <TiHome />,        label: "Dashboard",    path: "/admin/dashboard" },
    { icon: <FaCalendarAlt />, label: "Appointments", path: "/admin/appointments" },
    { icon: <FaUserMd />,      label: "Doctors",      path: "/admin/doctors" },
    { icon: <FaEnvelope />,    label: "Messages",     path: "/admin/messages" },
    // Reviews tab — so admin can delete spam or abusive comments
    { icon: <FaStar />,        label: "Reviews",      path: "/admin/reviews" },
  ];

  const manageItems = [
    { icon: <IoPersonAdd />,  label: "Add Doctor",    path: "/admin/doctor/addnew" },
    { icon: <FaUserShield />, label: "Add Admin",     path: "/admin/addnew" },
    { icon: <RiAdminFill />,  label: "Manage Admins", path: "/admin/manage-admins" },
  ];

  const initials = admin ? `${admin.firstName?.[0] || ""}${admin.lastName?.[0] || ""}`.toUpperCase() : "A";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@1,700&display=swap');

        @keyframes sideIn   { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 50%{box-shadow:0 0 12px 2px rgba(201,168,76,.25)} }
        @keyframes itemIn   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes shimmer  { 0%{left:-100%} 100%{left:200%} }

        .asb {
          width: 260px;
          background: #0a1810;
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; height: 100vh;
          z-index: 100;
          border-right: 1px solid rgba(255,255,255,.04);
          animation: sideIn .45s cubic-bezier(.22,1,.36,1) both;
          font-family: 'Outfit', sans-serif;
          overflow: hidden;
        }
        .asb::before {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
          background-image:
            linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .asb::after {
          content:''; position:absolute; top:-80px; left:-80px;
          width:300px; height:300px; border-radius:50%;
          background: radial-gradient(circle, rgba(26,92,58,.22) 0%, transparent 70%);
          pointer-events:none; z-index:0;
        }

        .asb-logo {
          padding: 26px 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          position: relative; z-index: 1; flex-shrink: 0;
          animation: fadeIn .5s .1s ease both;
        }
        .asb-logo-text {
          font-family: 'Fraunces', serif;
          font-size: 22px; font-weight: 700; font-style: italic;
          color: #fff; letter-spacing: -.3px; margin-bottom: 5px;
        }
        .asb-logo-text em { color: #c9a84c; font-style: normal; }
        .asb-logo-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
          text-transform: uppercase; color: #1a5c3a;
        }
        .asb-logo-dot { width:5px; height:5px; border-radius:50%; background:#1a5c3a; animation:pulse 2s infinite; }

        .asb-profile {
          margin: 14px 14px 0;
          padding: 12px 14px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;
          display: flex; align-items: center; gap: 11px;
          position: relative; z-index: 1; flex-shrink: 0;
          animation: fadeIn .5s .18s ease both;
          transition: background .25s, border-color .25s, transform .25s;
        }
        .asb-profile:hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.1); transform:translateY(-1px); }
        .asb-avatar {
          width:36px; height:36px; border-radius:10px;
          background: linear-gradient(135deg, #1a5c3a, #0a2e1c);
          border: 1.5px solid rgba(201,168,76,.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #c9a84c;
          flex-shrink: 0; animation: glow 3s ease-in-out infinite;
        }
        .asb-profile-name { font-size:13px; font-weight:700; color:#e2e8e4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .asb-profile-role { font-size:10px; color:#1a5c3a; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-top:1px; }
        .asb-profile-status {
          margin-left:auto; flex-shrink:0; width:7px; height:7px; border-radius:50%;
          background:#10b981; box-shadow:0 0 0 2px rgba(16,185,129,.25);
          animation: pulse 3s ease-in-out infinite;
        }

        .asb-nav {
          flex: 1; padding: 16px 0 8px;
          overflow-y: auto; position: relative; z-index: 1;
          scrollbar-width: none;
        }
        .asb-nav::-webkit-scrollbar { display:none; }

        .asb-section {
          font-size:9px; font-weight:700; letter-spacing:2.5px;
          text-transform:uppercase; color:#1e3a28;
          padding:12px 24px 6px; display:block;
        }

        .asb-item {
          display:flex !important; align-items:center !important; gap:12px !important;
          padding:10px 14px 10px 20px !important;
          color:#6b9980 !important; cursor:pointer !important;
          transition: color .2s, background .2s, border-color .2s, padding-left .25s cubic-bezier(.22,1,.36,1) !important;
          font-size:13.5px !important; font-weight:500 !important;
          border:none !important; background:none !important;
          width:100% !important; text-align:left !important;
          font-family:'Outfit', sans-serif !important;
          text-decoration:none !important;
          border-left:2px solid transparent !important;
          border-radius:0 !important;
          position:relative !important;
          margin:1px 0 !important;
          box-sizing:border-box !important;
          overflow:hidden !important;
        }
        .asb-item .asb-item-bg {
          position:absolute; inset:0;
          background: rgba(26,92,58,.12);
          transform:translateX(-100%);
          transition: transform .3s cubic-bezier(.22,1,.36,1);
          pointer-events:none;
        }
        .asb-item:hover .asb-item-bg { transform:translateX(0); }
        .asb-item:hover { color:#a8c9b8 !important; border-left-color:rgba(26,92,58,.6) !important; padding-left:24px !important; }
        .asb-item.on { color:#fff !important; background:rgba(26,92,58,.18) !important; border-left-color:#c9a84c !important; padding-left:24px !important; }
        .asb-item.on .asb-item-icon { color:#c9a84c !important; }

        .asb-item-icon { font-size:15px; flex-shrink:0; transition:transform .25s cubic-bezier(.22,1,.36,1), color .2s; color:inherit; display:flex; align-items:center; }
        .asb-item:hover .asb-item-icon { transform:scale(1.22) rotate(-4deg); }
        .asb-item.on .asb-item-icon { transform:scale(1.12); }

        .asb-item.on::after {
          content:''; position:absolute; right:14px; top:50%; transform:translateY(-50%);
          width:5px; height:5px; border-radius:50%; background:#c9a84c;
          animation:pulse 2.5s ease-in-out infinite;
          box-shadow:0 0 6px rgba(201,168,76,.5);
        }

        .asb-item:nth-child(1){animation:itemIn .35s .12s ease both}
        .asb-item:nth-child(2){animation:itemIn .35s .16s ease both}
        .asb-item:nth-child(3){animation:itemIn .35s .20s ease both}
        .asb-item:nth-child(4){animation:itemIn .35s .24s ease both}
        .asb-item:nth-child(5){animation:itemIn .35s .28s ease both}
        .asb-item:nth-child(6){animation:itemIn .35s .32s ease both}

        .asb-footer {
          padding:14px; border-top:1px solid rgba(255,255,255,.05);
          position:relative; z-index:1; flex-shrink:0;
          animation: fadeIn .5s .38s ease both;
        }
        .asb-logout {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px; width:100%;
          color:#6b8f7a; border:1px solid transparent;
          background:transparent; border-radius:10px;
          cursor:pointer; font-size:13px; font-weight:600;
          font-family:'Outfit', sans-serif;
          transition: color .25s, background .25s, border-color .25s;
          overflow:hidden; position:relative;
        }
        .asb-logout .asb-logout-fill {
          position:absolute; inset:0; background:rgba(239,68,68,.07);
          transform:translateX(-100%); transition:transform .3s cubic-bezier(.22,1,.36,1);
          pointer-events:none; border-radius:10px;
        }
        .asb-logout:hover .asb-logout-fill { transform:translateX(0); }
        .asb-logout:hover { color:#f87171; border-color:rgba(239,68,68,.2); }
        .asb-logout:disabled { opacity:.4; cursor:not-allowed; }
        .asb-logout-icon { font-size:14px; transition:transform .25s; }
        .asb-logout:hover .asb-logout-icon { transform:translateX(4px); }

        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .form-group { display:flex; flex-direction:column; gap:5px; margin-bottom:0; }
        .form-group label { font-size:11px; font-weight:700; color:#5a7a68; text-transform:uppercase; letter-spacing:.8px; font-family:'Outfit',sans-serif; }
        .form-group input, .form-group select {
          padding:10px 13px; border:1.5px solid #d4e8dc; border-radius:10px;
          font-size:13.5px; color:#0f2318; background:#fff;
          outline:none; transition:border-color .2s, box-shadow .2s, transform .2s;
          font-family:'Outfit',sans-serif; width:100%;
        }
        .form-group input:focus, .form-group select:focus {
          border-color:#1a5c3a; box-shadow:0 0 0 3px rgba(26,92,58,.1); transform:translateY(-1px);
        }
        .form-group input::placeholder { color:#aac4b6; }
        @media(max-width:600px){ .form-row{grid-template-columns:1fr;} }
      `}</style>

      <div className="asb">
        <div className="asb-logo">
          <div className="asb-logo-text">Clini<em>qo</em></div>
          <div className="asb-logo-badge"><span className="asb-logo-dot" /> Admin Panel</div>
        </div>

        {admin && (
          <div className="asb-profile">
            <div className="asb-avatar">{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="asb-profile-name">{admin.firstName} {admin.lastName}</div>
              <div className="asb-profile-role">Administrator</div>
            </div>
            <div className="asb-profile-status" />
          </div>
        )}

        <div className="asb-nav">
          <div className="asb-section">Overview</div>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`asb-item ${location.pathname === item.path ? "on" : ""}`}>
              <span className="asb-item-bg" />
              <span className="asb-item-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div className="asb-section" style={{ marginTop:8 }}>Manage</div>
          {manageItems.map(item => (
            <Link key={item.path} to={item.path} className={`asb-item ${location.pathname === item.path ? "on" : ""}`}>
              <span className="asb-item-bg" />
              <span className="asb-item-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="asb-footer">
          <button className="asb-logout" onClick={handleLogout} disabled={loggingOut}>
            <span className="asb-logout-fill" />
            <RiLogoutBoxFill className="asb-logout-icon" />
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;