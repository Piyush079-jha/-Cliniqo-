import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";

const STATUS = {
  Pending:   { bg:"#fffbeb", color:"#92400e", border:"#fde68a", dot:"#f59e0b" },
  Accepted:  { bg:"#ecfdf5", color:"#065f46", border:"#a7f3d0", dot:"#10b981" },
  Rejected:  { bg:"#fef2f2", color:"#991b1b", border:"#fecaca", dot:"#ef4444" },
  Confirmed: { bg:"#eff6ff", color:"#1e40af", border:"#bfdbfe", dot:"#3b82f6" },
  Completed: { bg:"#f0fdf4", color:"#14532d", border:"#86efac", dot:"#22c55e" },
  Cancelled: { bg:"#fafafa", color:"#52525b", border:"#d4d4d8", dot:"#a1a1aa" },
};

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("All");
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState("newest");

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`${BASE}/api/v1/appointment/getall`, { withCredentials: true });
      setAppointments(data.appointments || []);
    } catch { toast.error("Failed to load appointments"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const allStatuses = ["All", "Pending", "Accepted", "Confirmed", "Completed", "Rejected", "Cancelled"];
  const counts = allStatuses.reduce((acc, s) => {
    acc[s] = s === "All" ? appointments.length : appointments.filter(a => a.status === s).length;
    return acc;
  }, {});

  let filtered = appointments.filter(a => {
    const matchFilter = filter === "All" || a.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      `${a.doctor?.firstName} ${a.doctor?.lastName}`.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
  if (sortBy === "newest") filtered = [...filtered].reverse();
  if (sortBy === "name")   filtered = [...filtered].sort((a, b) => `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`));
  if (sortBy === "dept")   filtered = [...filtered].sort((a, b) => (a.department || "").localeCompare(b.department || ""));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@1,700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .ap { padding:36px 40px; background:#f5f7f5; min-height:100vh; font-family:'Outfit',sans-serif; }
        .ap-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; animation:fadeUp .4s ease both; }
        .ap-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:#0f1f15; letter-spacing:-.5px; }
        .ap-sub { font-size:13px; color:#6b8f7a; margin-top:5px; }
        .ap-notice {
          display:inline-flex; align-items:center; gap:8px;
          background:#fffbeb; border:1px solid #fde68a; border-radius:10px;
          padding:8px 16px; font-size:12.5px; font-weight:600; color:#92400e;
        }
        .ap-total { background:linear-gradient(135deg,#0a1810,#1a5c3a); color:#c9a84c; padding:10px 22px; border-radius:12px; font-size:13px; font-weight:700; box-shadow:0 4px 14px rgba(10,24,16,.2); }

        .ap-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; animation:fadeUp .4s .05s ease both; }
        .ap-ftab {
          display:flex; align-items:center; gap:7px;
          padding:8px 16px; border-radius:10px; font-size:12px; font-weight:600;
          cursor:pointer; border:1.5px solid #e2e8f0; background:#fff;
          transition:all .2s; user-select:none; color:#334155;
        }
        .ap-ftab:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.08); }
        .ap-ftab.on { background:#1e293b; color:#fff; border-color:#1e293b; }
        .ap-ftab-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .ap-ftab-count { font-size:11px; font-weight:700; padding:1px 7px; border-radius:999px; background:rgba(0,0,0,.07); }

        .ap-toolbar { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; align-items:center; animation:fadeUp .4s .08s ease both; }
        .ap-search-wrap { position:relative; flex:1; min-width:220px; max-width:360px; }
        .ap-search { width:100%; padding:10px 16px 10px 40px; border:1.5px solid #d4e8dc; border-radius:10px; font-size:13.5px; background:#fff; color:#0f1f15; outline:none; transition:all .2s; font-family:'Outfit',sans-serif; }
        .ap-search:focus { border-color:#1a5c3a; box-shadow:0 0 0 3px rgba(26,92,58,.1); }
        .ap-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; opacity:.4; pointer-events:none; }
        .ap-sort { padding:10px 14px; border:1.5px solid #d4e8dc; border-radius:10px; font-size:13px; background:#fff; color:#0f1f15; outline:none; font-family:'Outfit',sans-serif; cursor:pointer; }
        .ap-results { font-size:13px; color:#6b8f7a; font-weight:500; margin-left:auto; }

        .ap-wrap { background:#fff; border-radius:16px; border:1px solid #e4ede8; overflow:hidden; box-shadow:0 1px 4px rgba(15,35,24,.05); animation:fadeUp .4s .1s ease both; }
        .ap-table { width:100%; border-collapse:collapse; }
        .ap-table thead th { padding:13px 20px; text-align:left; font-size:10.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#a8c4b4; background:#f7fbf8; border-bottom:1px solid #e4ede8; }
        .ap-table tbody tr { border-bottom:1px solid #f0f5f2; transition:background .15s; animation:rowIn .3s ease both; }
        .ap-table tbody tr:last-child { border-bottom:none; }
        .ap-table tbody tr:hover { background:#f7fbf8; }
        .ap-table td { padding:14px 20px; font-size:13.5px; color:#0f1f15; vertical-align:middle; }

        .ap-patient-name { font-weight:700; color:#0f1f15; }
        .ap-patient-meta { font-size:11px; color:#6b8f7a; margin-top:2px; }
        .ap-doc-name { font-weight:600; }
        .ap-doc-dept { font-size:11px; color:#6b8f7a; margin-top:2px; }
        .ap-status { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:999px; font-size:11.5px; font-weight:700; border:1px solid; white-space:nowrap; }
        .ap-sdot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .ap-visited-yes { color:#065f46; font-weight:600; font-size:13px; }
        .ap-visited-no  { color:#a8c4b4; font-size:13px; }
        .ap-managed-by  { font-size:12px; color:#6b8f7a; font-style:italic; }

        .ap-empty { text-align:center; padding:60px; color:#a8c4b4; }
        .ap-empty-icon { font-size:44px; margin-bottom:12px; opacity:.35; }

        @media(max-width:900px){
          .ap{padding:20px 16px;}
          .ap-table thead{display:none;}
          .ap-table tr{display:block;margin-bottom:12px;border:1px solid #e4ede8;border-radius:12px;}
          .ap-table td{display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f0f5f2;}
          .ap-table td:last-child{border-bottom:none;}
        }
      `}</style>

      <div className="ap">
        <div className="ap-head">
          <div>
            <div className="ap-title">Appointments</div>
            <div className="ap-sub">View-only overview of all patient appointments</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
            <div className="ap-notice">
              🩺 Appointment actions are  managed by doctors
            </div>
            <div className="ap-total">📋 {appointments.length} Total</div>
          </div>
        </div>

        <div className="ap-filters">
          {allStatuses.map(s => {
            const sc = STATUS[s] || {};
            return (
              <div
                key={s}
                className={`ap-ftab ${filter === s ? "on" : ""}`}
                onClick={() => setFilter(s)}
                style={filter !== s && s !== "All" ? { background: sc.bg, color: sc.color, borderColor: sc.border } : {}}
              >
                <span className="ap-ftab-dot" style={{ background: filter === s ? "rgba(255,255,255,.6)" : (sc.dot || "#94a3b8") }} />
                {s}
                <span className="ap-ftab-count">{counts[s]}</span>
              </div>
            );
          })}
        </div>

        <div className="ap-toolbar">
          <div className="ap-search-wrap">
            <span className="ap-search-icon">🔍</span>
            <input className="ap-search" placeholder="Search patient, doctor, department…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="ap-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Sort: Newest first</option>
            <option value="name">Sort: Patient name</option>
            <option value="dept">Sort: Department</option>
          </select>
          <span className="ap-results">Showing {filtered.length} of {appointments.length}</span>
        </div>

        <div className="ap-wrap">
          {loading ? (
            <div className="ap-empty"><div className="ap-empty-icon">⏳</div>Loading appointments…</div>
          ) : filtered.length === 0 ? (
            <div className="ap-empty"><div className="ap-empty-icon">📭</div>No appointments found</div>
          ) : (
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Visited</th>
                  <th>Status</th>
                  <th>Managed By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const sc = STATUS[a.status] || STATUS.Pending;
                  return (
                    <tr key={a._id} style={{ animationDelay:`${Math.min(i * .03, .4)}s` }}>
                      <td>
                        <div className="ap-patient-name">{a.firstName} {a.lastName}</div>
                        <div className="ap-patient-meta">{a.email}</div>
                      </td>
                      <td>
                        <div className="ap-doc-name">Dr. {a.doctor?.firstName} {a.doctor?.lastName}</div>
                        <div className="ap-doc-dept">{a.department}</div>
                      </td>
                      <td>{a.appointment_date}</td>
                      <td>{a.hasVisited ? <span className="ap-visited-yes">✅ Yes</span> : <span className="ap-visited-no">— No</span>}</td>
                      <td>
                        <span className="ap-status" style={{ background:sc.bg, color:sc.color, borderColor:sc.border }}>
                          <span className="ap-sdot" style={{ background:sc.dot }} />
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <span className="ap-managed-by">🩺 Doctor</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Appointments;
