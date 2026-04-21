
import axios from "axios";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const BASE = "https://cliniqo-backend.onrender.com/api/v1/user/login";
const DEPARTMENTS = ["Pediatrics","Orthopedics","Cardiology","Neurology","Oncology","Radiology","Physical Therapy","Dermatology","ENT"];

// All possible time slots 6AM–10PM
const ALL_TIMES = [];
for (let h = 6; h <= 22; h++) {
  ALL_TIMES.push(`${String(h).padStart(2,"0")}:00`);
  if (h < 22) ALL_TIMES.push(`${String(h).padStart(2,"0")}:30`);
}
function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${m.toString().padStart(2,"0")} ${ampm}`;
}

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap');

  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes shimmer  { 0%{left:-100%} 100%{left:200%} }
  @keyframes floatUp  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

  .fp { padding:36px 40px; background:#f5f7f5; min-height:100vh; font-family:'Outfit',sans-serif; }
  .fp-head { margin-bottom:28px; animation:fadeUp .4s ease both; }
  .fp-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:#0f1f15; letter-spacing:-.5px; }
  .fp-sub   { font-size:13px; color:#6b8f7a; margin-top:5px; }

  .fp-prog { max-width:780px; margin-bottom:22px; animation:fadeUp .4s .05s ease both; }
  .fp-prog-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
  .fp-prog-lbl { font-size:11px; font-weight:600; color:#6b8f7a; letter-spacing:.5px; }
  .fp-prog-pct { font-size:12px; font-weight:800; color:#1a5c3a; }
  .fp-prog-track { height:5px; background:#e0ede6; border-radius:999px; overflow:hidden; }
  .fp-prog-fill  { height:100%; border-radius:999px; background:linear-gradient(90deg,#1a5c3a,#c9a84c); transition:width .4s cubic-bezier(.22,1,.36,1); }

  .fp-card {
    background:#fff; border-radius:20px; border:1.5px solid #e4ede8;
    padding:30px 32px; max-width:780px;
    box-shadow:0 2px 16px rgba(15,35,24,.06);
    animation:fadeUp .4s .08s ease both; position:relative; overflow:hidden;
  }
  .fp-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:4px;
    background:linear-gradient(90deg,#1a5c3a,#c9a84c,#1a5c3a);
    background-size:200% 100%; animation:shimmer 3s linear infinite;
  }

  .fp-warn {
    display:flex; align-items:center; gap:16px;
    padding:16px 20px; border-radius:14px; margin-bottom:24px;
    background:linear-gradient(135deg,#f0faf4,#fefdf0);
    border:1.5px solid #d4e8dc; animation:fadeUp .4s .1s ease both;
  }
  .fp-warn-icon {
    width:48px; height:48px; border-radius:13px; flex-shrink:0;
    background:linear-gradient(135deg,#1a5c3a,#2d7a52);
    display:flex; align-items:center; justify-content:center; font-size:22px;
    box-shadow:0 4px 14px rgba(26,92,58,.2); animation:floatUp 3s ease-in-out infinite;
  }
  .fp-warn-title { font-size:15px; font-weight:800; color:#0f1f15; }
  .fp-warn-desc  { font-size:12px; color:#6b8f7a; margin-top:3px; }

  .fp-section {
    font-size:10px; font-weight:800; letter-spacing:2.5px; text-transform:uppercase;
    color:#a8c4b4; padding-bottom:10px; border-bottom:1.5px solid #f0f5f2;
    margin:24px 0 16px; display:flex; align-items:center; gap:8px;
  }
  .fp-section::before { content:''; width:3px; height:12px; background:#1a5c3a; border-radius:2px; }
  .fp-section:first-of-type { margin-top:0; }

  .fp-row   { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .fp-row-1 { display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:16px; }

  .fp-grp       { display:flex; flex-direction:column; gap:6px; }
  .fp-grp label { font-size:11px; font-weight:700; color:#4a7060; letter-spacing:1px; text-transform:uppercase; }
  .fp-grp input,
  .fp-grp select {
    padding:11px 14px; border:1.5px solid #dde8e3; border-radius:11px;
    font-size:13.5px; color:#0f1f15; background:#fafcfb; outline:none;
    transition:all .2s; font-family:'Outfit',sans-serif; width:100%;
  }
  .fp-grp input:focus,
  .fp-grp select:focus {
    border-color:#1a5c3a; background:#fff;
    box-shadow:0 0 0 3px rgba(26,92,58,.1); transform:translateY(-1px);
  }
  .fp-grp input::placeholder { color:#b8cfc5; }

  .fp-btn {
    width:100%; padding:14px; margin-top:12px;
    background:linear-gradient(135deg,#0a1810,#1a5c3a);
    color:#c9a84c; border:none; border-radius:13px;
    font-size:14px; font-weight:800; cursor:pointer;
    font-family:'Outfit',sans-serif;
    display:flex; align-items:center; justify-content:center; gap:9px;
    transition:all .22s; letter-spacing:.3px;
    box-shadow:0 4px 20px rgba(10,24,16,.2); position:relative; overflow:hidden;
  }
  .fp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(10,24,16,.3); }
  .fp-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  .fp-spinner {
    width:16px; height:16px; border-radius:50%;
    border:2px solid rgba(201,168,76,.3); border-top-color:#c9a84c;
    animation:spin .7s linear infinite;
  }

  .fp-layout { display:grid; grid-template-columns:190px 1fr; gap:22px; max-width:780px; align-items:start; }
  .fp-av-card {
    background:#fff; border-radius:18px; border:1.5px solid #e4ede8;
    padding:24px 16px; text-align:center; position:sticky; top:24px;
    box-shadow:0 2px 12px rgba(15,35,24,.05); animation:fadeUp .4s .08s ease both;
  }
  .fp-av-ring {
    width:100px; height:100px; border-radius:50%; margin:0 auto 14px;
    overflow:hidden; background:#f0faf4; border:2.5px solid #1a5c3a; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:38px;
    box-shadow:0 4px 18px rgba(26,92,58,.15); transition:all .25s; position:relative;
  }
  .fp-av-ring:hover { transform:scale(1.06); }
  .fp-av-ring img { width:100%; height:100%; object-fit:cover; }
  .fp-av-overlay {
    position:absolute; inset:0; background:rgba(10,24,16,.65); border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:800; color:#c9a84c; letter-spacing:1px;
    opacity:0; transition:opacity .2s;
  }
  .fp-av-ring:hover .fp-av-overlay { opacity:1; }
  .fp-av-name { font-size:12px; font-weight:700; color:#4a7060; margin-bottom:4px; }
  .fp-av-ok   { font-size:11px; color:#1a5c3a; font-weight:600; }
  .fp-av-err  { font-size:11px; color:#ef4444; font-weight:600; }

  /* ── Availability builder ── */
  .av-builder { display:flex; flex-direction:column; gap:10px; }
  .av-day-row {
    display:grid; grid-template-columns:130px 1fr auto; align-items:center; gap:12px;
    padding:12px 16px; border-radius:12px; background:#fafcfb; border:1.5px solid #e4ede8;
    transition:border-color .2s;
  }
  .av-day-row.active { border-color:#1a5c3a; background:#f0fdf4; }
  .av-day-toggle {
    display:flex; align-items:center; gap:8px; cursor:pointer;
  }
  .av-toggle-box {
    width:36px; height:20px; border-radius:999px; background:#e4ede8;
    position:relative; transition:background .2s; flex-shrink:0;
  }
  .av-toggle-box.on { background:#1a5c3a; }
  .av-toggle-knob {
    position:absolute; top:3px; left:3px; width:14px; height:14px;
    border-radius:50%; background:#fff; transition:transform .2s;
    box-shadow:0 1px 4px rgba(0,0,0,.2);
  }
  .av-toggle-box.on .av-toggle-knob { transform:translateX(16px); }
  .av-day-name { font-size:13px; font-weight:700; color:#0f1f15; }
  .av-time-wrap { display:flex; align-items:center; gap:8px; }
  .av-time-select {
    padding:7px 10px; border:1.5px solid #dde8e3; border-radius:9px;
    font-size:12.5px; color:#0f1f15; background:#fff; outline:none;
    font-family:'Outfit',sans-serif; cursor:pointer; transition:border-color .2s;
  }
  .av-time-select:focus { border-color:#1a5c3a; }
  .av-time-sep { font-size:12px; color:#6b8f7a; font-weight:600; }
  .av-day-slots { font-size:11px; color:#6b8f7a; font-weight:600; white-space:nowrap; }
  .av-off-msg { font-size:12px; color:#a8c4b4; font-style:italic; }

  .av-preview {
    margin-top:14px; padding:14px 16px;
    background:linear-gradient(135deg,#f0fdf4,#fefdf0);
    border:1.5px solid #d4e8dc; border-radius:12px;
  }
  .av-preview-title { font-size:11px; font-weight:800; color:#1a5c3a; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
  .av-preview-grid { display:flex; flex-wrap:wrap; gap:6px; }
  .av-preview-chip {
    padding:4px 10px; background:#fff; border:1px solid #d4e8dc;
    border-radius:999px; font-size:11px; font-weight:600; color:#1a5c3a;
  }

  @media(max-width:700px){ .fp{padding:20px 16px;} .fp-row{grid-template-columns:1fr;} .fp-layout{grid-template-columns:1fr;} .av-day-row{grid-template-columns:1fr; gap:8px;} }
`;

// ============================================================
// AddNewDoctor
// ============================================================
export const AddNewDoctor = () => {
  const { isAdminAuthenticated } = useContext(Context);
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", phone:"",
    nic:"", dob:"", gender:"", password:"", doctorDepartment:""
  });
  const [docAvatar, setDocAvatar] = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [loading,   setLoading]   = useState(false);

  // Availability: each day has { enabled, start, end }
  const [availability, setAvailability] = useState(
    DAYS.reduce((acc, d) => ({
      ...acc,
      [d]: { enabled: ["Monday","Tuesday","Wednesday","Thursday","Friday"].includes(d), start:"09:00", end:"17:00" }
    }), {})
  );

  if (!isAdminAuthenticated) return <Navigate to="/admin/login" />;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile   = e => {
    const file = e.target.files[0];
    if (file) { setDocAvatar(file); setPreview(URL.createObjectURL(file)); }
  };

  const toggleDay = (day) => setAvailability(prev => ({
    ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled }
  }));

  const setTime = (day, field, val) => setAvailability(prev => ({
    ...prev, [day]: { ...prev[day], [field]: val }
  }));

  const countSlots = (start, end) => {
    const s = parseInt(start), e = parseInt(end);
    return Math.max(0, (e - s) * 2);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!docAvatar) { toast.error("Doctor photo is required!"); return; }
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    fd.append("docAvatar", docAvatar);
    fd.append("availability", JSON.stringify(availability));
    try {
      const res = await axios.post(`${BASE}/api/v1/user/doctor/addnew`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(res.data.message);
      setForm({ firstName:"",lastName:"",email:"",phone:"",nic:"",dob:"",gender:"",password:"",doctorDepartment:"" });
      setDocAvatar(null); setPreview(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add doctor"); }
    finally { setLoading(false); }
  };

  const filled = Object.values(form).filter(Boolean).length + (docAvatar ? 1 : 0);
  const total  = Object.keys(form).length + 1;
  const pct    = Math.round((filled / total) * 100);

  const activeDays = DAYS.filter(d => availability[d].enabled);

  return (
    <>
      <style>{STYLES}</style>
      <div className="fp">
        <div className="fp-head">
          <div className="fp-title">Add New Doctor</div>
          <div className="fp-sub">Register a new doctor to the Cliniqo network</div>
        </div>

        <div className="fp-prog">
          <div className="fp-prog-row">
            <span className="fp-prog-lbl">Form Completion</span>
            <span className="fp-prog-pct">{pct}%</span>
          </div>
          <div className="fp-prog-track">
            <div className="fp-prog-fill" style={{ width:`${pct}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fp-layout">

            {/* Avatar sidebar */}
            <div className="fp-av-card">
              <label style={{ cursor:"pointer" }}>
                <div className="fp-av-ring">
                  {preview ? <img src={preview} alt="preview" /> : "👨‍⚕️"}
                  <div className="fp-av-overlay">CHANGE</div>
                </div>
                <input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
              </label>
              <div className="fp-av-name">Doctor Photo</div>
              {docAvatar
                ? <div className="fp-av-ok">✓ Photo ready</div>
                : <div className="fp-av-err">Required *</div>
              }
            </div>

            {/* Main form */}
            <div className="fp-card" style={{ maxWidth:"100%" }}>
              <div className="fp-section">Personal Information</div>
              <div className="fp-row">
                <div className="fp-grp"><label>First Name</label><input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required /></div>
                <div className="fp-grp"><label>Last Name</label><input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required /></div>
              </div>
              <div className="fp-row">
                <div className="fp-grp"><label>Email Address</label><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="doctor@cliniqo.com" required /></div>
                <div className="fp-grp"><label>Phone Number</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required /></div>
              </div>
              <div className="fp-row">
                <div className="fp-grp"><label>NIC Number</label><input name="nic" value={form.nic} onChange={handleChange} placeholder="13-digit NIC" required /></div>
                <div className="fp-grp"><label>Date of Birth</label><input name="dob" type="date" value={form.dob} onChange={handleChange} required /></div>
              </div>

              <div className="fp-section">Professional Details</div>
              <div className="fp-row">
                <div className="fp-grp">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="fp-grp">
                  <label>Department</label>
                  <select name="doctorDepartment" value={form.doctorDepartment} onChange={handleChange} required>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* AVAILABILITY SECTION  */}
              <div className="fp-section">Working Hours & Availability</div>
              <div className="av-builder">
                {DAYS.map(day => {
                  const av = availability[day];
                  const slots = countSlots(av.start, av.end);
                  return (
                    <div key={day} className={`av-day-row ${av.enabled ? "active" : ""}`}>
                      {/* Toggle + Day name */}
                      <div className="av-day-toggle" onClick={() => toggleDay(day)}>
                        <div className={`av-toggle-box ${av.enabled ? "on" : ""}`}>
                          <div className="av-toggle-knob" />
                        </div>
                        <span className="av-day-name">{day}</span>
                      </div>

                      {/* Time pickers */}
                      {av.enabled ? (
                        <div className="av-time-wrap">
                          <select className="av-time-select" value={av.start} onChange={e => setTime(day,"start",e.target.value)}>
                            {ALL_TIMES.map(t => <option key={t} value={t}>{fmt12(t)}</option>)}
                          </select>
                          <span className="av-time-sep">→</span>
                          <select className="av-time-select" value={av.end} onChange={e => setTime(day,"end",e.target.value)}>
                            {ALL_TIMES.map(t => <option key={t} value={t}>{fmt12(t)}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="av-off-msg">Day off</span>
                      )}

                      {/* Slot count */}
                      {av.enabled
                        ? <span className="av-day-slots">{slots} slots</span>
                        : <span />
                      }
                    </div>
                  );
                })}
              </div>

              {/* Preview active days */}
              {activeDays.length > 0 && (
                <div className="av-preview">
                  <div className="av-preview-title">📅 Schedule Preview</div>
                  <div className="av-preview-grid">
                    {activeDays.map(d => (
                      <div key={d} className="av-preview-chip">
                        {d.slice(0,3)} · {fmt12(availability[d].start)} – {fmt12(availability[d].end)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="fp-section">Account Security</div>
              <div className="fp-row-1">
                <div className="fp-grp"><label>Password</label><input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" required /></div>
              </div>

              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? <><div className="fp-spinner"/>Adding Doctor…</> : "➕ Add Doctor to Cliniqo"}
              </button>
            </div>

          </div>
        </form>
      </div>
    </>
  );
};


export const AddNewAdmin = () => {
  const { isAdminAuthenticated } = useContext(Context);
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", phone:"",
    nic:"", dob:"", gender:"", password:""
  });
  const [loading, setLoading] = useState(false);

  if (!isAdminAuthenticated) return <Navigate to="/admin/login" />;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/api/v1/user/admin/addnew`, form, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" }
      });
      toast.success(res.data.message);
      setForm({ firstName:"",lastName:"",email:"",phone:"",nic:"",dob:"",gender:"",password:"" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add admin"); }
    finally { setLoading(false); }
  };

  const pct = Math.round((Object.values(form).filter(Boolean).length / Object.keys(form).length) * 100);

  return (
    <>
      <style>{STYLES}</style>
      <div className="fp">
        <div className="fp-head">
          <div className="fp-title">Add New Admin</div>
          <div className="fp-sub">Grant admin access to the Cliniqo dashboard</div>
        </div>

        <div className="fp-prog" style={{ maxWidth:640 }}>
          <div className="fp-prog-row">
            <span className="fp-prog-lbl">Form Completion</span>
            <span className="fp-prog-pct">{pct}%</span>
          </div>
          <div className="fp-prog-track">
            <div className="fp-prog-fill" style={{ width:`${pct}%` }} />
          </div>
        </div>

        <div className="fp-card" style={{ maxWidth:640 }}>
          <div className="fp-warn">
            <div className="fp-warn-icon">🛡️</div>
            <div>
              <div className="fp-warn-title">Create Admin Account</div>
              <div className="fp-warn-desc">This person will have full access to the Cliniqo admin panel</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="fp-section">Personal Information</div>
            <div className="fp-row">
              <div className="fp-grp"><label>First Name</label><input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required /></div>
              <div className="fp-grp"><label>Last Name</label><input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required /></div>
            </div>
            <div className="fp-row">
              <div className="fp-grp"><label>Email Address</label><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@cliniqo.com" required /></div>
              <div className="fp-grp"><label>Phone Number</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required /></div>
            </div>
            <div className="fp-row">
              <div className="fp-grp"><label>NIC Number</label><input name="nic" value={form.nic} onChange={handleChange} placeholder="13-digit NIC" required /></div>
              <div className="fp-grp"><label>Date of Birth</label><input name="dob" type="date" value={form.dob} onChange={handleChange} required /></div>
            </div>

            <div className="fp-section">Account Details</div>
            <div className="fp-row">
              <div className="fp-grp">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="fp-grp"><label>Password</label><input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" required /></div>
            </div>

            <button type="submit" className="fp-btn" disabled={loading}>
              {loading ? <><div className="fp-spinner"/>Creating Admin…</> : "🛡️ Create Admin Account"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddNewDoctor;