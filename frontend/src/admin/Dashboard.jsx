import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import axios from "axios";
import { FaUserMd, FaCalendarAlt, FaEnvelope, FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";

const Dashboard = () => {
  const { admin } = useContext(Context);
  const [appointments, setAppointments] = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, d, m] = await Promise.allSettled([
          axios.get(`${BASE}/api/v1/appointment/getall`, { withCredentials: true }),
          axios.get(`${BASE}/api/v1/user/doctors`,        { withCredentials: true }),
          axios.get(`${BASE}/api/v1/message/getall`,      { withCredentials: true }),
        ]);
        if (a.status === "fulfilled") setAppointments(a.value.data.appointments || []);
        if (d.status === "fulfilled") setDoctors(d.value.data.doctors || []);
        if (m.status === "fulfilled") setMessages(m.value.data.messages || []);
      } finally { setLoading(false); }
    })();
  }, []);

  const pending  = appointments.filter(a => a.status === "Pending").length;
  const accepted = appointments.filter(a => a.status === "Accepted").length;
  const rejected = appointments.filter(a => a.status === "Rejected").length;
  const recent   = [...appointments].reverse().slice(0, 6);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const STATUS = {
    Pending:  { bg:"#fffbeb", color:"#92400e", border:"#fde68a", dot:"#f59e0b" },
    Accepted: { bg:"#ecfdf5", color:"#065f46", border:"#a7f3d0", dot:"#10b981" },
    Rejected: { bg:"#fef2f2", color:"#991b1b", border:"#fecaca", dot:"#ef4444" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;1,700&display=swap');

        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes countUp  { from{opacity:0;transform:scale(.75) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes rowIn    { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes barFill  { from{width:0} to{width:var(--w)} }
        @keyframes shimmer  { 0%{left:-100%} 100%{left:200%} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes bannerGlow { 0%,100%{box-shadow:0 8px 32px rgba(10,24,16,.3)} 50%{box-shadow:0 8px 48px rgba(26,92,58,.35)} }

        .dw { padding:36px 40px; background:#f5f7f5; min-height:100vh; font-family:'Outfit',sans-serif; }

        /* ── Welcome banner ── */
        .dw-banner {
          background:linear-gradient(135deg,#0a1810 0%,#0f2d1a 45%,#1a5c3a 100%);
          border-radius:20px; padding:36px 40px;
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:28px; position:relative; overflow:hidden;
          animation: fadeUp .5s ease both, bannerGlow 4s 1s ease-in-out infinite;
        }
        .dw-banner::before {
          content:''; position:absolute; inset:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
          background-size:32px 32px;
        }
        /* Shimmer sweep */
        .dw-banner::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);
          animation: shimmer 5s 1.5s ease-in-out infinite;
          pointer-events:none;
        }
        .dw-banner-glow {
          position:absolute; top:-60px; right:60px;
          width:240px; height:240px; border-radius:50%;
          background:radial-gradient(circle,rgba(201,168,76,.12) 0%,transparent 70%);
          pointer-events:none;
        }
        .dw-banner-left { position:relative; z-index:1; }
        .dw-greeting { font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#c9a84c; margin-bottom:10px; animation:fadeIn .5s .3s ease both; }
        .dw-name {
          font-family:'Fraunces',serif; font-size:32px; font-weight:700;
          color:#fff; line-height:1.1; margin-bottom:8px;
          animation: fadeUp .5s .2s ease both;
        }
        .dw-sub { font-size:14px; color:rgba(255,255,255,.5); max-width:380px; animation:fadeIn .5s .4s ease both; }
        .dw-banner-stats { position:relative; z-index:1; display:flex; gap:16px; animation:fadeUp .5s .35s ease both; }
        .dw-bstat {
          background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
          border-radius:16px; padding:18px 22px; text-align:center; min-width:90px;
          transition: background .25s, transform .25s;
        }
        .dw-bstat:hover { background:rgba(255,255,255,.12); transform:translateY(-2px); }
        .dw-bstat-val { font-size:28px; font-weight:800; color:#c9a84c; line-height:1; }
        .dw-bstat-lbl { font-size:10px; color:rgba(255,255,255,.45); margin-top:5px; letter-spacing:1px; text-transform:uppercase; }

        /* ── Stat cards ── */
        .dw-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; margin-bottom:28px; }
        .dstat {
          background:#fff; border-radius:16px; padding:24px;
          border:1px solid #e4ede8; position:relative; overflow:hidden;
          box-shadow:0 1px 4px rgba(15,35,24,.05);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s;
          animation: fadeUp .5s ease both;
        }
        .dstat:hover { transform:translateY(-5px); box-shadow:0 14px 36px rgba(15,35,24,.12); }
        /* Shimmer on hover */
        .dstat::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
          pointer-events:none;
        }
        .dstat:hover::after { animation: shimmer .55s ease; }
        .dstat-bar { position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
        .dstat-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .dstat-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; transition: transform .3s; }
        .dstat:hover .dstat-icon { transform: scale(1.12) rotate(-5deg); }
        .dstat-trend { font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; }
        .dstat-val { font-size:34px; font-weight:800; color:#0f1f15; line-height:1; margin-bottom:4px; animation:countUp .6s .2s cubic-bezier(.22,1,.36,1) both; }
        .dstat-lbl { font-size:12px; color:#6b8f7a; font-weight:600; text-transform:uppercase; letter-spacing:.7px; }
        .dstat-sub { font-size:12px; color:#a8c4b4; margin-top:10px; }

        /* ── Bottom grid ── */
        .dw-bottom { display:grid; grid-template-columns:1.5fr 1fr; gap:20px; }

        .dw-card {
          background:#fff; border-radius:16px;
          border:1px solid #e4ede8; overflow:hidden;
          box-shadow:0 1px 4px rgba(15,35,24,.05);
          animation: fadeUp .5s .12s ease both;
        }
        .dw-card-head {
          padding:18px 24px; border-bottom:1px solid #f0f5f2;
          display:flex; align-items:center; justify-content:space-between;
        }
        .dw-card-title { font-size:15px; font-weight:700; color:#0f1f15; }
        .dw-card-link {
          font-size:12px; color:#1a5c3a; font-weight:600;
          text-decoration:none; padding:5px 13px;
          background:#f0f5f2; border-radius:999px; border:1px solid #d4e8dc;
          transition: all .2s;
        }
        .dw-card-link:hover { background:#1a5c3a; color:#fff; transform:translateX(2px); }

        .appt-row {
          display:flex; align-items:center; gap:14px;
          padding:14px 24px; border-bottom:1px solid #f7fbf8;
          transition: background .18s;
          animation: rowIn .3s ease both;
        }
        .appt-row:last-child { border-bottom:none; }
        .appt-row:hover { background:#f7fbf8; }
        .appt-av {
          width:38px; height:38px; border-radius:10px;
          background:linear-gradient(135deg,#c8e6d8,#e8f5ee);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#1a5c3a; flex-shrink:0;
          transition: transform .2s;
        }
        .appt-row:hover .appt-av { transform:scale(1.08); }
        .appt-name { font-size:13px; font-weight:700; color:#0f1f15; }
        .appt-meta { font-size:11px; color:#6b8f7a; margin-top:2px; }
        .appt-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; border:1px solid; white-space:nowrap; flex-shrink:0; }

        /* Quick panel */
        .dw-quick { display:flex; flex-direction:column; gap:14px; animation: fadeUp .5s .18s ease both; }
        .qcard {
          background:#fff; border-radius:14px; padding:18px 20px;
          border:1px solid #e4ede8; display:flex; align-items:center; gap:16px;
          box-shadow:0 1px 4px rgba(15,35,24,.05);
          transition: transform .25s, box-shadow .25s;
        }
        .qcard:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(15,35,24,.1); }
        .qcard-icon { font-size:24px; flex-shrink:0; transition: transform .3s; }
        .qcard:hover .qcard-icon { transform:scale(1.18) rotate(-5deg); }
        .qcard-val { font-size:24px; font-weight:800; color:#0f1f15; line-height:1; }
        .qcard-lbl { font-size:12px; color:#6b8f7a; margin-top:2px; }

        /* Status breakdown */
        .ss-card { background:#fff; border-radius:14px; padding:20px 22px; border:1px solid #e4ede8; box-shadow:0 1px 4px rgba(15,35,24,.05); }
        .ss-title { font-size:14px; font-weight:700; color:#0f1f15; margin-bottom:16px; }
        .ss-row { margin-bottom:14px; }
        .ss-row:last-child { margin-bottom:0; }
        .ss-header { display:flex; align-items:center; gap:8px; margin-bottom:7px; }
        .ss-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .ss-label { font-size:13px; color:#6b8f7a; flex:1; }
        .ss-count { font-size:13px; font-weight:700; color:#0f1f15; }
        .ss-track { height:5px; background:#f0f5f2; border-radius:999px; overflow:hidden; }
        .ss-fill { height:100%; border-radius:999px; transition: width 1.1s cubic-bezier(.22,1,.36,1); }

        .dw-empty { text-align:center; padding:40px; color:#a8c4b4; font-size:14px; }
        .dw-loading { text-align:center; padding:80px; color:#a8c4b4; }

        @media(max-width:1100px){ .dw-stats{grid-template-columns:repeat(2,1fr);} .dw-bottom{grid-template-columns:1fr;} .dw-banner{flex-direction:column;gap:24px;align-items:flex-start;} }
        @media(max-width:640px){ .dw{padding:20px 16px;} .dw-stats{grid-template-columns:1fr 1fr;} }
      `}</style>

      <div className="dw">
        {/* Banner */}
        <div className="dw-banner">
          <div className="dw-banner-glow" />
          <div className="dw-banner-left">
            <div className="dw-greeting">{greeting} 👋</div>
            <div className="dw-name">{admin ? `${admin.firstName} ${admin.lastName}` : "Admin"}</div>
            <div className="dw-sub">Here's what's happening at Cliniqo today</div>
          </div>
          <div className="dw-banner-stats">
            <div className="dw-bstat"><div className="dw-bstat-val">{appointments.length}</div><div className="dw-bstat-lbl">Appointments</div></div>
            <div className="dw-bstat"><div className="dw-bstat-val">{pending}</div><div className="dw-bstat-lbl">Pending</div></div>
          </div>
        </div>

        {loading ? (
          <div className="dw-loading">Loading dashboard…</div>
        ) : (
          <>
            <div className="dw-stats">
              {[
                { icon:<FaCalendarAlt/>, val:appointments.length, label:"Total Appointments", sub:`${pending} awaiting review`, bar:"linear-gradient(90deg,#1a5c3a,#2d9c66)", iconBg:"#edf7f1", iconColor:"#1a5c3a", trend:`${accepted} accepted`, trendBg:"#ecfdf5", trendColor:"#065f46", delay:".05s" },
                { icon:<FaUserMd/>,      val:doctors.length,      label:"Active Doctors",    sub:"Across all departments",      bar:"linear-gradient(90deg,#0ea5e9,#38bdf8)", iconBg:"#f0f9ff", iconColor:"#0ea5e9", trend:"All active",       trendBg:"#f0f9ff", trendColor:"#0369a1", delay:".1s"  },
                { icon:<FaEnvelope/>,    val:messages.length,     label:"Messages",          sub:"Patient inquiries",           bar:"linear-gradient(90deg,#c9a84c,#e8c96a)", iconBg:"#fdf6e3", iconColor:"#c9a84c", trend:"View all",        trendBg:"#fdf6e3", trendColor:"#92400e", delay:".15s" },
                { icon:<FaCheckCircle/>, val:accepted,            label:"Confirmed",         sub:`${rejected} rejected`,        bar:"linear-gradient(90deg,#10b981,#6ee7b7)", iconBg:"#ecfdf5", iconColor:"#10b981", trend:`${rejected} rejected`, trendBg:"#fef2f2", trendColor:"#991b1b", delay:".2s" },
              ].map((s,i) => (
                <div className="dstat" key={i} style={{ animationDelay:s.delay }}>
                  <div className="dstat-bar" style={{ background:s.bar }} />
                  <div className="dstat-header">
                    <div className="dstat-icon" style={{ background:s.iconBg, color:s.iconColor }}>{s.icon}</div>
                    <div className="dstat-trend" style={{ background:s.trendBg, color:s.trendColor }}>{s.trend}</div>
                  </div>
                  <div className="dstat-val">{s.val}</div>
                  <div className="dstat-lbl">{s.label}</div>
                  <div className="dstat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="dw-bottom">
              <div className="dw-card">
                <div className="dw-card-head">
                  <div className="dw-card-title">Recent Appointments</div>
                  <Link to="/admin/appointments" className="dw-card-link">View all →</Link>
                </div>
                {recent.length === 0 ? <div className="dw-empty">No appointments yet</div> :
                  recent.map((a, i) => {
                    const sc = STATUS[a.status] || STATUS.Pending;
                    return (
                      <div className="appt-row" key={a._id} style={{ animationDelay:`${i*.05}s` }}>
                        <div className="appt-av">{a.firstName?.[0]}{a.lastName?.[0]}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="appt-name">{a.firstName} {a.lastName}</div>
                          <div className="appt-meta">Dr. {a.doctor?.firstName} {a.doctor?.lastName} · {a.department}</div>
                        </div>
                        <span className="appt-badge" style={{ background:sc.bg, color:sc.color, borderColor:sc.border }}>{a.status}</span>
                      </div>
                    );
                  })}
              </div>

              <div className="dw-quick">
                <div className="qcard"><div className="qcard-icon">🏥</div><div><div className="qcard-val">{doctors.length}</div><div className="qcard-lbl">Active Doctors</div></div></div>
                <div className="qcard"><div className="qcard-icon">💬</div><div><div className="qcard-val">{messages.length}</div><div className="qcard-lbl">Total Messages</div></div></div>
                <div className="ss-card">
                  <div className="ss-title">Appointment Status</div>
                  {[
                    { label:"Pending",  count:pending,  color:"#f59e0b" },
                    { label:"Accepted", count:accepted, color:"#10b981" },
                    { label:"Rejected", count:rejected, color:"#ef4444" },
                  ].map(s => (
                    <div className="ss-row" key={s.label}>
                      <div className="ss-header">
                        <div className="ss-dot" style={{ background:s.color }} />
                        <span className="ss-label">{s.label}</span>
                        <span className="ss-count">{s.count}</span>
                      </div>
                      <div className="ss-track">
                        <div className="ss-fill" style={{ width: appointments.length ? `${(s.count/appointments.length)*100}%` : "0%", background:s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;