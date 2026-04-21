import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const BASE = "http://localhost:5000";

const AV_COLORS = ["#1a5c3a","#2563eb","#9333ea","#ea580c","#0d9488","#db2777","#c9a84c","#16a34a","#0ea5e9","#ef4444"];
const getColor    = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];
const getInitials = (f,l) => `${f?.[0]||""}${l?.[0]||""}`.toUpperCase();

const ManageAdmins = () => {
  const { isAdminAuthenticated, admin } = useContext(Context);
  const [admins,   setAdmins]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    axios.get(`${BASE}/api/v1/user/admins`, { withCredentials: true })
      .then(({ data }) => setAdmins(data.admins || []))
      .catch(() => toast.error("Failed to load admins"))
      .finally(() => setLoading(false));
  }, [isAdminAuthenticated]);

  if (!isAdminAuthenticated) return <Navigate to="/admin/login" />;

  const handleDelete = async id => {
    if (admin?._id === id) { toast.error("You cannot delete yourself!"); return; }
    if (!window.confirm("Remove this admin?")) return;
    setDeleting(id);
    try {
      await axios.delete(`${BASE}/api/v1/user/admin/delete/${id}`, { withCredentials: true });
      setAdmins(prev => prev.filter(a => a._id !== id));
      toast.success("Admin removed successfully!");
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
    finally { setDeleting(null); }
  };

  const filtered = admins.filter(a => {
    const q = search.toLowerCase();
    return !q || `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@1,700&display=swap');

        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn   { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{left:-100%} 100%{left:200%} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

        .ma { padding:36px 40px; min-height:100vh; background:#f5f7f5; font-family:'Outfit',sans-serif; }

        .ma-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; animation:fadeUp .4s ease both; }
        .ma-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:#0f1f15; letter-spacing:-.5px; }
        .ma-sub   { font-size:13px; color:#6b8f7a; margin-top:4px; }
        .ma-badge { background:linear-gradient(135deg,#0a1810,#1a5c3a); color:#c9a84c; padding:10px 22px; border-radius:12px; font-size:13px; font-weight:700; box-shadow:0 4px 14px rgba(10,24,16,.2); }

        .ma-bar { background:#fff; border-radius:14px; border:1px solid #e4ede8; padding:16px 20px; margin-bottom:20px; box-shadow:0 1px 4px rgba(15,35,24,.04); animation:fadeUp .4s .05s ease both; }
        .ma-sw  { position:relative; max-width:380px; }
        .ma-si  {
          width:100%; padding:10px 14px 10px 40px; border:1.5px solid #e4ede8; border-radius:10px;
          font-size:13.5px; background:#f7fbf8; color:#0f1f15; outline:none;
          transition:all .2s; font-family:'Outfit',sans-serif;
        }
        .ma-si:focus { border-color:#1a5c3a; background:#fff; box-shadow:0 0 0 3px rgba(26,92,58,.08); transform:translateY(-1px); }
        .ma-sico { position:absolute; left:13px; top:50%; transform:translateY(-50%); opacity:.35; pointer-events:none; font-size:14px; }

        .ma-list { display:flex; flex-direction:column; gap:10px; animation:fadeUp .4s .1s ease both; }

        .ma-card {
          background:#fff; border-radius:14px; border:1px solid #e4ede8;
          display:flex; align-items:center; gap:0; overflow:hidden;
          box-shadow:0 1px 4px rgba(15,35,24,.04);
          transition:box-shadow .25s, transform .25s, border-color .25s;
          animation:rowIn .3s ease both; position:relative;
        }
        .ma-card::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); pointer-events:none;
        }
        .ma-card:hover { box-shadow:0 10px 32px rgba(15,35,24,.11); transform:translateY(-3px); border-color:#d4e8dc; }
        .ma-card:hover::after { animation:shimmer .55s ease; }
        .ma-card.is-you { border-color:#c9a84c; background:linear-gradient(135deg,#fffdf0,#fff); }

        .ma-accent { width:4px; flex-shrink:0; align-self:stretch; }

        .ma-av-wrap { padding:16px 18px; flex-shrink:0; }
        .ma-av {
          width:52px; height:52px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          font-size:18px; font-weight:800; color:#fff; overflow:hidden; flex-shrink:0;
          box-shadow:0 3px 10px rgba(0,0,0,.15);
          transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
        }
        .ma-card:hover .ma-av { transform:scale(1.08) rotate(-3deg); box-shadow:0 6px 18px rgba(0,0,0,.2); }

        .ma-info { flex:1; min-width:0; padding:16px 0; }
        .ma-name { font-size:15px; font-weight:800; color:#0f1f15; margin-bottom:4px; }
        .ma-you-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:2px 10px; border-radius:6px; font-size:11px; font-weight:700;
          background:#fefce8; color:#c9a84c; border:1px solid #fde68a; margin-bottom:6px;
        }
        .ma-meta { display:flex; gap:20px; flex-wrap:wrap; }
        .ma-meta-item { display:flex; align-items:center; gap:5px; font-size:12px; color:#6b8f7a; }
        .ma-meta-icon { font-size:12px; opacity:.7; }

        .ma-actions { padding:16px 20px; display:flex; flex-direction:column; gap:8px; align-items:flex-end; flex-shrink:0; }
        .ma-role-badge {
          padding:4px 12px; border-radius:7px; font-size:11px; font-weight:700;
          background:#f0faf4; color:#1a5c3a; border:1px solid #d4e8dc;
        }
        .ma-del-btn {
          padding:7px 14px; border-radius:8px;
          background:#fef2f2; color:#ef4444; border:1.5px solid #fecaca;
          font-size:12px; font-weight:700; cursor:pointer;
          transition:all .2s; font-family:'Outfit',sans-serif;
        }
        .ma-del-btn:hover:not(:disabled) { background:#ef4444; color:#fff; border-color:#ef4444; transform:translateY(-1px); box-shadow:0 4px 12px rgba(239,68,68,.25); }
        .ma-del-btn:disabled { opacity:.4; cursor:not-allowed; }
        .ma-self-btn {
          padding:7px 14px; border-radius:8px;
          background:#f7fbf8; color:#a8c4b4; border:1.5px solid #e4ede8;
          font-size:12px; font-weight:700; cursor:not-allowed; font-family:'Outfit',sans-serif;
        }

        .ma-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; animation:fadeUp .4s .03s ease both; }
        .ma-stat {
          background:#fff; border-radius:14px; border:1px solid #e4ede8;
          padding:18px 20px; box-shadow:0 1px 4px rgba(15,35,24,.04);
          transition:transform .2s, box-shadow .2s; position:relative; overflow:hidden;
        }
        .ma-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(15,35,24,.08); }
        .ma-stat-icon { font-size:24px; margin-bottom:8px; }
        .ma-stat-val  { font-size:26px; font-weight:800; color:#0f1f15; }
        .ma-stat-lbl  { font-size:12px; color:#6b8f7a; margin-top:3px; }
        .ma-stat-bar  { position:absolute; bottom:0; left:0; right:0; height:3px; }

        .ma-empty { text-align:center; padding:80px 24px; color:#a8c4b4; }
        .ma-empty-ico { font-size:52px; margin-bottom:14px; opacity:.3; }

        @media(max-width:700px){ .ma{padding:20px 16px;} .ma-stats{grid-template-columns:1fr 1fr;} .ma-meta{gap:10px;} }
      `}</style>

      <div className="ma">
        <div className="ma-head">
          <div>
            <div className="ma-title">Manage Admins</div>
            <div className="ma-sub">View and manage administrator accounts</div>
          </div>
          <div className="ma-badge">🛡️ {admins.length} Admins</div>
        </div>

        {/* Stats */}
        <div className="ma-stats">
          <div className="ma-stat">
            <div className="ma-stat-icon">🛡️</div>
            <div className="ma-stat-val">{admins.length}</div>
            <div className="ma-stat-lbl">Total Admins</div>
            <div className="ma-stat-bar" style={{ background:"linear-gradient(90deg,#1a5c3a,#c9a84c)" }}/>
          </div>
          <div className="ma-stat">
            <div className="ma-stat-icon">✅</div>
            <div className="ma-stat-val">{admins.length}</div>
            <div className="ma-stat-lbl">Active Accounts</div>
            <div className="ma-stat-bar" style={{ background:"linear-gradient(90deg,#10b981,#34d399)" }}/>
          </div>
          <div className="ma-stat">
            <div className="ma-stat-icon">👤</div>
            <div className="ma-stat-val">1</div>
            <div className="ma-stat-lbl">Logged In (You)</div>
            <div className="ma-stat-bar" style={{ background:"linear-gradient(90deg,#c9a84c,#f59e0b)" }}/>
          </div>
        </div>

        {/* Search */}
        <div className="ma-bar">
          <div className="ma-sw">
            <span className="ma-sico">🔍</span>
            <input className="ma-si" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="ma-empty"><div className="ma-empty-ico">⏳</div><p>Loading admins…</p></div>
        ) : filtered.length === 0 ? (
          <div className="ma-empty"><div className="ma-empty-ico">🛡️</div><p>No admins found</p></div>
        ) : (
          <div className="ma-list">
            {filtered.map((a, i) => {
              const isYou = admin?._id === a._id;
              const col   = getColor(a.firstName);
              const ini   = getInitials(a.firstName, a.lastName);
              return (
                <div key={a._id} className={`ma-card ${isYou ? "is-you" : ""}`} style={{ animationDelay:`${Math.min(i*.03,.45)}s` }}>
                  <div className="ma-accent" style={{ background: isYou ? "#c9a84c" : col }} />
                  <div className="ma-av-wrap">
                    <div className="ma-av" style={{ background: col }}>{ini}</div>
                  </div>
                  <div className="ma-info">
                    <div className="ma-name">{a.firstName} {a.lastName}</div>
                    {isYou && <div className="ma-you-badge">⭐ You</div>}
                    <div className="ma-meta">
                      <div className="ma-meta-item"><span className="ma-meta-icon">✉</span>{a.email}</div>
                      <div className="ma-meta-item"><span className="ma-meta-icon">📞</span>{a.phone}</div>
                      <div className="ma-meta-item"><span className="ma-meta-icon">⚧</span>{a.gender}</div>
                      <div className="ma-meta-item"><span className="ma-meta-icon">🎂</span>{a.dob?.substring(0,10)}</div>
                    </div>
                  </div>
                  <div className="ma-actions">
                    <div className="ma-role-badge">🛡️ Administrator</div>
                    {isYou
                      ? <div className="ma-self-btn">🔒 Current User</div>
                      : <button className="ma-del-btn" onClick={() => handleDelete(a._id)} disabled={deleting === a._id}>
                          {deleting === a._id ? "…" : "🗑 Remove"}
                        </button>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ManageAdmins;