import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const BASE = "https://cliniqo-backend.onrender.com/api/v1/user/login";
const DEPARTMENTS = ["Cardiology","Neurology","Orthopedics","Oncology","Radiology","Pediatrics","Dermatology","ENT","Physical Therapy"];

const DEPT_COLORS = {
  Cardiology:         { bg:"#fff1f2", color:"#e11d48",  border:"#fecdd3" },
  Neurology:          { bg:"#eff6ff", color:"#2563eb",  border:"#bfdbfe" },
  Orthopedics:        { bg:"#fff7ed", color:"#ea580c",  border:"#fed7aa" },
  Oncology:           { bg:"#fdf4ff", color:"#9333ea",  border:"#e9d5ff" },
  Radiology:          { bg:"#f0fdf4", color:"#16a34a",  border:"#bbf7d0" },
  Pediatrics:         { bg:"#fefce8", color:"#ca8a04",  border:"#fde68a" },
  Dermatology:        { bg:"#fdf2f8", color:"#db2777",  border:"#fbcfe8" },
  ENT:                { bg:"#f0fdfa", color:"#0d9488",  border:"#99f6e4" },
  "Physical Therapy": { bg:"#f8fafc", color:"#475569",  border:"#cbd5e1" },
};

const AV_COLORS = ["#1a5c3a","#2563eb","#9333ea","#ea580c","#0d9488","#db2777","#c9a84c","#16a34a","#0ea5e9","#ef4444"];
const getColor    = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];
const getInitials = (f,l) => `${f?.[0]||""}${l?.[0]||""}`.toUpperCase();

const AdminDoctors = () => {
  const [doctors,  setDoctors]  = useState([]);
  const [search,   setSearch]   = useState("");
  const [dept,     setDept]     = useState("All");
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [imgErr,   setImgErr]   = useState({});
  const { isAdminAuthenticated } = useContext(Context);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    axios.get(`${BASE}/api/v1/user/doctors`, { withCredentials: true })
      .then(({ data }) => setDoctors(data.doctors || []))
      .catch(() => toast.error("Failed to load doctors"))
      .finally(() => setLoading(false));
  }, [isAdminAuthenticated]);

  if (!isAdminAuthenticated) return <Navigate to="/admin/login" />;

  const allDepts = ["All", ...new Set(doctors.map(d => d.doctorDepartment).filter(Boolean))];
  const filtered = doctors.filter(d => {
    const matchDept = dept === "All" || d.doctorDepartment === dept;
    const q = search.toLowerCase();
    return matchDept && (!q ||
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.doctorDepartment?.toLowerCase().includes(q));
  });

  const openEdit  = doc => setEditing({ ...doc });
  const closeEdit = () => { setEditing(null); setSaving(false); };
  const onChange  = e => setEditing(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        firstName:editing.firstName, lastName:editing.lastName,
        email:editing.email, phone:editing.phone,
        nic:editing.nic, dob:editing.dob,
        gender:editing.gender, doctorDepartment:editing.doctorDepartment,
      };
      await axios.put(`${BASE}/api/v1/user/doctor/update/${editing._id}`, body, { withCredentials: true });
      setDoctors(prev => prev.map(d => d._id === editing._id ? { ...d, ...body } : d));
      toast.success("Doctor updated");
      closeEdit();
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Remove this doctor?")) return;
    setDeleting(id);
    try {
      await axios.delete(`${BASE}/api/v1/user/doctor/delete/${id}`, { withCredentials: true });
      setDoctors(prev => prev.filter(d => d._id !== id));
      toast.success("Doctor removed");
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@1,700&display=swap');

        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn     { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        @keyframes modalIn   { from{opacity:0;transform:scale(.95) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes shimmer   { 0%{left:-100%} 100%{left:200%} }

        .dp { padding:36px 40px; min-height:100vh; background:#f5f7f5; font-family:'Outfit',sans-serif; }

        .dp-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; animation:fadeUp .4s ease both; }
        .dp-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:#0f1f15; letter-spacing:-.5px; }
        .dp-sub   { font-size:13px; color:#6b8f7a; margin-top:4px; }
        .dp-badge { background:linear-gradient(135deg,#0a1810,#1a5c3a); color:#c9a84c; padding:10px 22px; border-radius:12px; font-size:13px; font-weight:700; box-shadow:0 4px 14px rgba(10,24,16,.2); transition: transform .25s, box-shadow .25s; }
        .dp-badge:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(10,24,16,.3); }

        .dp-bar { background:#fff; border-radius:14px; border:1px solid #e4ede8; padding:16px 20px; margin-bottom:20px; box-shadow:0 1px 4px rgba(15,35,24,.04); animation:fadeUp .4s .05s ease both; }
        .dp-search-row { display:flex; gap:12px; align-items:center; margin-bottom:14px; }
        .dp-sw { position:relative; flex:1; max-width:380px; }
        .dp-si {
          width:100%; padding:10px 14px 10px 40px; border:1.5px solid #e4ede8; border-radius:10px;
          font-size:13.5px; background:#f7fbf8; color:#0f1f15; outline:none;
          transition:all .2s; font-family:'Outfit',sans-serif;
        }
        .dp-si:focus { border-color:#1a5c3a; background:#fff; box-shadow:0 0 0 3px rgba(26,92,58,.08); transform:translateY(-1px); }
        .dp-sico { position:absolute; left:13px; top:50%; transform:translateY(-50%); opacity:.35; pointer-events:none; font-size:14px; }
        .dp-count { font-size:13px; color:#6b8f7a; font-weight:500; margin-left:auto; }

        .dp-chips { display:flex; gap:7px; flex-wrap:wrap; }
        .dp-chip {
          padding:5px 14px; border-radius:8px; font-size:12px; font-weight:600;
          cursor:pointer; border:1.5px solid #e4ede8; background:#f7fbf8; color:#6b8f7a;
          transition:all .2s cubic-bezier(.22,1,.36,1); font-family:'Outfit',sans-serif;
          white-space:nowrap; user-select:none;
        }
        .dp-chip:hover { border-color:#1a5c3a; color:#1a5c3a; background:#fff; transform:translateY(-1px); }
        .dp-chip.on { background:#0a1810; color:#c9a84c; border-color:#0a1810; transform:translateY(-1px); }

        .dp-list { display:flex; flex-direction:column; gap:10px; animation:fadeUp .4s .1s ease both; }
        .dp-card {
          background:#fff; border-radius:14px; border:1px solid #e4ede8;
          display:flex; align-items:center; gap:0;
          box-shadow:0 1px 4px rgba(15,35,24,.04);
          overflow:hidden; transition:box-shadow .25s, transform .25s, border-color .25s;
          animation:rowIn .3s ease both; position:relative;
        }
        .dp-card::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
          pointer-events:none;
        }
        .dp-card:hover { box-shadow:0 10px 32px rgba(15,35,24,.11); transform:translateY(-3px); border-color:#d4e8dc; }
        .dp-card:hover::after { animation:shimmer .55s ease; }

        .dp-accent { width:4px; flex-shrink:0; align-self:stretch; transition:width .2s; }
        .dp-card:hover .dp-accent { width:5px; }

        .dp-av-wrap { padding:16px 18px; flex-shrink:0; }
        .dp-av {
          width:52px; height:52px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          font-size:18px; font-weight:800; color:#fff;
          font-family:'Outfit',sans-serif; overflow:hidden; flex-shrink:0;
          box-shadow:0 3px 10px rgba(0,0,0,.15);
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
        }
        .dp-card:hover .dp-av { transform:scale(1.08) rotate(-3deg); box-shadow:0 6px 18px rgba(0,0,0,.2); }
        .dp-av img { width:100%; height:100%; object-fit:cover; }

        .dp-info { flex:1; min-width:0; padding:16px 0; }
        .dp-name { font-size:15px; font-weight:800; color:#0f1f15; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dp-dept-pill { display:inline-flex; align-items:center; padding:2px 10px; border-radius:6px; font-size:11px; font-weight:700; border:1px solid; margin-bottom:8px; }
        .dp-meta { display:flex; gap:20px; flex-wrap:wrap; }
        .dp-meta-item { display:flex; align-items:center; gap:5px; font-size:12px; color:#6b8f7a; }
        .dp-meta-icon { font-size:12px; opacity:.7; }

        .dp-actions { padding:16px 20px; display:flex; flex-direction:column; gap:8px; align-items:flex-end; flex-shrink:0; }
        .dp-edit-btn {
          padding:7px 18px; border-radius:8px;
          background:#f0f5f2; color:#1a5c3a; border:1.5px solid #d4e8dc;
          font-size:12px; font-weight:700; cursor:pointer;
          transition:all .2s cubic-bezier(.22,1,.36,1); font-family:'Outfit',sans-serif; white-space:nowrap;
        }
        .dp-edit-btn:hover { background:#1a5c3a; color:#fff; border-color:#1a5c3a; transform:translateY(-1px); box-shadow:0 4px 12px rgba(26,92,58,.25); }
        .dp-del-btn {
          padding:7px 12px; border-radius:8px;
          background:#fef2f2; color:#ef4444; border:1.5px solid #fecaca;
          font-size:12px; font-weight:700; cursor:pointer;
          transition:all .2s cubic-bezier(.22,1,.36,1); font-family:'Outfit',sans-serif;
        }
        .dp-del-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; transform:translateY(-1px); box-shadow:0 4px 12px rgba(239,68,68,.25); }
        .dp-del-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }

        .dp-empty { text-align:center; padding:80px 24px; color:#a8c4b4; }
        .dp-empty-ico { font-size:52px; margin-bottom:14px; opacity:.3; }
        .dp-empty p { font-size:15px; }

        /* MODAL */
        .dp-overlay {
          position:fixed; inset:0; z-index:9999;
          background:rgba(0,0,0,.5); backdrop-filter:blur(6px);
          display:flex; align-items:center; justify-content:center;
          padding:20px; animation:overlayIn .2s ease both;
        }
        .dp-modal {
          background:#fff; border-radius:20px; width:100%; max-width:580px;
          max-height:92vh; overflow-y:auto;
          box-shadow:0 32px 80px rgba(0,0,0,.25);
          animation:modalIn .35s cubic-bezier(.22,1,.36,1) both;
        }
        .dp-modal::-webkit-scrollbar { width:4px; }
        .dp-modal::-webkit-scrollbar-thumb { background:#d4e8dc; border-radius:4px; }

        .dp-mh {
          padding:22px 26px 18px; border-bottom:1px solid #f0f5f2;
          display:flex; align-items:center; gap:14px;
          position:sticky; top:0; background:#fff; z-index:2; border-radius:20px 20px 0 0;
        }
        .dp-mh-av { width:46px; height:46px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:#fff; flex-shrink:0; overflow:hidden; font-family:'Outfit',sans-serif; }
        .dp-mh-av img { width:100%; height:100%; object-fit:cover; }
        .dp-mh-name { font-size:16px; font-weight:800; color:#0f1f15; }
        .dp-mh-dept { font-size:12px; color:#6b8f7a; margin-top:2px; }
        .dp-mh-x { margin-left:auto; width:32px; height:32px; border-radius:9px; background:#f5f7f5; border:none; cursor:pointer; font-size:14px; color:#6b8f7a; transition:all .2s; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dp-mh-x:hover { background:#e4ede8; color:#0f1f15; transform:rotate(90deg); }

        .dp-mb { padding:22px 26px 26px; }
        .dp-msec { font-size:9.5px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#a8c4b4; border-bottom:1px solid #f0f5f2; padding-bottom:10px; margin:22px 0 16px; }
        .dp-msec:first-child { margin-top:0; }
        .dp-mr { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
        .dp-fg { display:flex; flex-direction:column; gap:6px; }
        .dp-fg label { font-size:10.5px; font-weight:700; color:#6b8f7a; text-transform:uppercase; letter-spacing:.8px; }
        .dp-fg input, .dp-fg select {
          padding:10px 13px; border:1.5px solid #e4ede8; border-radius:10px;
          font-size:13.5px; color:#0f1f15; background:#f9fafb;
          outline:none; transition:all .2s; font-family:'Outfit',sans-serif; width:100%;
        }
        .dp-fg input:focus, .dp-fg select:focus { border-color:#1a5c3a; background:#fff; box-shadow:0 0 0 3px rgba(26,92,58,.08); transform:translateY(-1px); }
        .dp-fg input::placeholder { color:#b8d0c4; }

        .dp-mfoot { display:flex; gap:10px; margin-top:22px; padding-top:18px; border-top:1px solid #f0f5f2; }
        .dp-msave {
          flex:1; padding:13px; border-radius:11px;
          background:linear-gradient(135deg,#1a5c3a,#0a2e1c);
          color:#fff; border:none; font-size:14px; font-weight:700;
          cursor:pointer; font-family:'Outfit',sans-serif;
          transition:all .25s cubic-bezier(.22,1,.36,1); box-shadow:0 4px 16px rgba(26,92,58,.3);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .dp-msave:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(26,92,58,.4); }
        .dp-msave:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .dp-mcancel { padding:13px 22px; border-radius:11px; background:#f5f7f5; color:#6b8f7a; border:1.5px solid #e4ede8; font-size:14px; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; transition:all .2s; }
        .dp-mcancel:hover { background:#e4ede8; color:#0f1f15; }
        .dp-spin { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin .7s linear infinite; flex-shrink:0; }

        @media(max-width:700px){ .dp{padding:20px 16px;} .dp-meta{gap:10px;} .dp-mr{grid-template-columns:1fr;} .dp-actions{flex-direction:row;padding:12px 14px;} }
      `}</style>

      <div className="dp">
        <div className="dp-head">
          <div>
            <div className="dp-title">Doctors</div>
            <div className="dp-sub">Manage your registered medical staff</div>
          </div>
          <div className="dp-badge">👨‍⚕️ {doctors.length} Registered</div>
        </div>

        <div className="dp-bar">
          <div className="dp-search-row">
            <div className="dp-sw">
              <span className="dp-sico">🔍</span>
              <input className="dp-si" placeholder="Search by name, email or department…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <span className="dp-count">Showing {filtered.length} of {doctors.length}</span>
          </div>
          <div className="dp-chips">
            {allDepts.map(d => (
              <div key={d} className={`dp-chip ${dept===d?"on":""}`} onClick={()=>setDept(d)}>{d}</div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="dp-empty"><div className="dp-empty-ico">⏳</div><p>Loading doctors…</p></div>
        ) : filtered.length === 0 ? (
          <div className="dp-empty"><div className="dp-empty-ico">👨‍⚕️</div><p>No doctors found</p></div>
        ) : (
          <div className="dp-list">
            {filtered.map((doc,i) => {
              const dc     = DEPT_COLORS[doc.doctorDepartment] || { bg:"#f0f5f2", color:"#1a5c3a", border:"#d4e8dc" };
              const col    = getColor(doc.firstName);
              const ini    = getInitials(doc.firstName, doc.lastName);
              const hasImg = doc.docAvatar?.url && !imgErr[doc._id];
              return (
                <div key={doc._id} className="dp-card" style={{ animationDelay:`${Math.min(i*.03,.45)}s` }}>
                  <div className="dp-accent" style={{ background:dc.color }} />
                  <div className="dp-av-wrap">
                    <div className="dp-av" style={{ background:hasImg?"#e8f5ee":col }}>
                      {hasImg
                        ? <img src={doc.docAvatar.url} alt={doc.firstName} onError={()=>setImgErr(p=>({...p,[doc._id]:true}))} />
                        : ini}
                    </div>
                  </div>
                  <div className="dp-info">
                    <div className="dp-name">Dr. {doc.firstName} {doc.lastName}</div>
                    <div className="dp-dept-pill" style={{ background:dc.bg, color:dc.color, borderColor:dc.border }}>{doc.doctorDepartment}</div>
                    <div className="dp-meta">
                      <div className="dp-meta-item"><span className="dp-meta-icon">✉</span>{doc.email}</div>
                      <div className="dp-meta-item"><span className="dp-meta-icon">📞</span>{doc.phone}</div>
                      <div className="dp-meta-item"><span className="dp-meta-icon">⚧</span>{doc.gender}</div>
                      <div className="dp-meta-item"><span className="dp-meta-icon">🎂</span>{doc.dob?.substring(0,10)}</div>
                    </div>
                  </div>
                  <div className="dp-actions">
                    <button className="dp-edit-btn" onClick={()=>openEdit(doc)}>✏️ Edit</button>
                    <button className="dp-del-btn" onClick={()=>handleDelete(doc._id)} disabled={deleting===doc._id}>
                      {deleting===doc._id?"…":"🗑 Remove"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="dp-overlay" onClick={e=>e.target===e.currentTarget&&closeEdit()}>
          <div className="dp-modal">
            <div className="dp-mh">
              <div className="dp-mh-av" style={{ background:editing.docAvatar?.url&&!imgErr[editing._id]?"#e8f5ee":getColor(editing.firstName) }}>
                {editing.docAvatar?.url&&!imgErr[editing._id]
                  ? <img src={editing.docAvatar.url} alt="" onError={()=>setImgErr(p=>({...p,[editing._id]:true}))} />
                  : getInitials(editing.firstName, editing.lastName)}
              </div>
              <div>
                <div className="dp-mh-name">Edit Dr. {editing.firstName} {editing.lastName}</div>
                <div className="dp-mh-dept">{editing.doctorDepartment}</div>
              </div>
              <button className="dp-mh-x" onClick={closeEdit}>✕</button>
            </div>
            <div className="dp-mb">
              <div className="dp-msec">Personal Information</div>
              <div className="dp-mr">
                <div className="dp-fg"><label>First Name</label><input name="firstName" value={editing.firstName||""} onChange={onChange} placeholder="First name" /></div>
                <div className="dp-fg"><label>Last Name</label><input name="lastName" value={editing.lastName||""} onChange={onChange} placeholder="Last name" /></div>
              </div>
              <div className="dp-mr">
                <div className="dp-fg"><label>Email Address</label><input name="email" type="email" value={editing.email||""} onChange={onChange} /></div>
                <div className="dp-fg"><label>Phone Number</label><input name="phone" value={editing.phone||""} onChange={onChange} /></div>
              </div>
              <div className="dp-mr">
                <div className="dp-fg"><label>NIC Number</label><input name="nic" value={editing.nic||""} onChange={onChange} /></div>
                <div className="dp-fg"><label>Date of Birth</label><input name="dob" type="date" value={editing.dob?.substring(0,10)||""} onChange={onChange} /></div>
              </div>
              <div className="dp-msec">Professional Details</div>
              <div className="dp-mr">
                <div className="dp-fg">
                  <label>Gender</label>
                  <select name="gender" value={editing.gender||""} onChange={onChange}>
                    <option value="">Select gender</option>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div className="dp-fg">
                  <label>Department</label>
                  <select name="doctorDepartment" value={editing.doctorDepartment||""} onChange={onChange}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="dp-mfoot">
                <button className="dp-mcancel" onClick={closeEdit}>Cancel</button>
                <button className="dp-msave" onClick={handleSave} disabled={saving}>
                  {saving?<><div className="dp-spin"/>Saving…</>:"💾 Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDoctors;
