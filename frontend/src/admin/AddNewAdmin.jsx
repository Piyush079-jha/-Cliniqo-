import axios from "axios";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const BASE = "http://localhost:5000";

const AddNewAdmin = () => {
  const { isAdminAuthenticated } = useContext(Context);
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", phone:"",
    dob:"", gender:"", password:""
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
      setForm({ firstName:"", lastName:"", email:"", phone:"", dob:"", gender:"", password:"" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add admin");
    } finally { setLoading(false); }
  };

  const pct = Math.round((Object.values(form).filter(Boolean).length / Object.keys(form).length) * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@1,700&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{left:-100%} 100%{left:200%} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

        .aa { padding:36px 40px; background:#f5f7f5; min-height:100vh; font-family:'Outfit',sans-serif; }
        .aa-head { margin-bottom:28px; animation:fadeUp .4s ease both; }
        .aa-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:#0f1f15; letter-spacing:-.5px; }
        .aa-sub   { font-size:13px; color:#6b8f7a; margin-top:5px; }

        .aa-prog { max-width:640px; margin-bottom:22px; animation:fadeUp .4s .05s ease both; }
        .aa-prog-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
        .aa-prog-lbl { font-size:11px; font-weight:600; color:#6b8f7a; }
        .aa-prog-pct { font-size:12px; font-weight:800; color:#1a5c3a; }
        .aa-prog-track { height:5px; background:#e0ede6; border-radius:999px; overflow:hidden; }
        .aa-prog-fill  { height:100%; border-radius:999px; background:linear-gradient(90deg,#1a5c3a,#c9a84c); transition:width .4s cubic-bezier(.22,1,.36,1); }

        .aa-card {
          background:#fff; border-radius:20px; border:1.5px solid #e4ede8;
          padding:30px 32px; max-width:640px;
          box-shadow:0 2px 16px rgba(15,35,24,.06);
          animation:fadeUp .4s .08s ease both; position:relative; overflow:hidden;
        }
        .aa-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:4px;
          background:linear-gradient(90deg,#1a5c3a,#c9a84c,#1a5c3a);
          background-size:200% 100%; animation:shimmer 3s linear infinite;
        }

        .aa-warn {
          display:flex; align-items:center; gap:16px; padding:16px 20px;
          border-radius:14px; margin-bottom:24px;
          background:linear-gradient(135deg,#f0faf4,#fefdf0); border:1.5px solid #d4e8dc;
        }
        .aa-warn-icon {
          width:48px; height:48px; border-radius:13px; flex-shrink:0;
          background:linear-gradient(135deg,#1a5c3a,#2d7a52);
          display:flex; align-items:center; justify-content:center; font-size:22px;
          box-shadow:0 4px 14px rgba(26,92,58,.2); animation:floatUp 3s ease-in-out infinite;
        }
        .aa-warn-title { font-size:15px; font-weight:800; color:#0f1f15; }
        .aa-warn-desc  { font-size:12px; color:#6b8f7a; margin-top:3px; }

        .aa-section {
          font-size:10px; font-weight:800; letter-spacing:2.5px; text-transform:uppercase;
          color:#a8c4b4; padding-bottom:10px; border-bottom:1.5px solid #f0f5f2;
          margin:24px 0 16px; display:flex; align-items:center; gap:8px;
        }
        .aa-section::before { content:''; width:3px; height:12px; background:#1a5c3a; border-radius:2px; }
        .aa-section:first-of-type { margin-top:0; }

        .aa-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .aa-grp { display:flex; flex-direction:column; gap:6px; }
        .aa-grp label { font-size:11px; font-weight:700; color:#4a7060; letter-spacing:1px; text-transform:uppercase; }
        .aa-grp input, .aa-grp select {
          padding:11px 14px; border:1.5px solid #dde8e3; border-radius:11px;
          font-size:13.5px; color:#0f1f15; background:#fafcfb; outline:none;
          transition:all .2s; font-family:'Outfit',sans-serif; width:100%;
        }
        .aa-grp input:focus, .aa-grp select:focus {
          border-color:#1a5c3a; background:#fff;
          box-shadow:0 0 0 3px rgba(26,92,58,.1); transform:translateY(-1px);
        }
        .aa-grp input::placeholder { color:#b8cfc5; }
        .aa-grp select option { background:#fff; color:#0f1f15; }

        .aa-btn {
          width:100%; padding:14px; margin-top:12px;
          background:linear-gradient(135deg,#0a1810,#1a5c3a);
          color:#c9a84c; border:none; border-radius:13px;
          font-size:14px; font-weight:800; cursor:pointer; font-family:'Outfit',sans-serif;
          display:flex; align-items:center; justify-content:center; gap:9px;
          transition:all .22s; box-shadow:0 4px 20px rgba(10,24,16,.2);
          position:relative; overflow:hidden;
        }
        .aa-btn::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(201,168,76,.15),transparent); pointer-events:none;
        }
        .aa-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(10,24,16,.3); }
        .aa-btn:hover:not(:disabled)::after { animation:shimmer .6s ease; }
        .aa-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .aa-spinner { width:16px; height:16px; border-radius:50%; border:2px solid rgba(201,168,76,.3); border-top-color:#c9a84c; animation:spin .7s linear infinite; }

        @media(max-width:700px){ .aa{padding:20px 16px;} .aa-row{grid-template-columns:1fr;} }
      `}</style>

      <div className="aa">
        <div className="aa-head">
          <div className="aa-title">Add New Admin</div>
          <div className="aa-sub">Grant admin access to the Cliniqo dashboard</div>
        </div>

        <div className="aa-prog">
          <div className="aa-prog-row">
            <span className="aa-prog-lbl">Form Completion</span>
            <span className="aa-prog-pct">{pct}%</span>
          </div>
          <div className="aa-prog-track">
            <div className="aa-prog-fill" style={{ width:`${pct}%` }} />
          </div>
        </div>

        <div className="aa-card">
          <div className="aa-warn">
            <div className="aa-warn-icon">🛡️</div>
            <div>
              <div className="aa-warn-title">Create Admin Account</div>
              <div className="aa-warn-desc">This person will have full access to the Cliniqo admin panel</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="aa-section">Personal Information</div>
            <div className="aa-row">
              <div className="aa-grp"><label>First Name</label><input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required /></div>
              <div className="aa-grp"><label>Last Name</label><input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required /></div>
            </div>
            <div className="aa-row">
              <div className="aa-grp"><label>Email Address</label><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@cliniqo.com" required /></div>
              <div className="aa-grp"><label>Phone Number</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required /></div>
            </div>
            <div className="aa-row">
              <div className="aa-grp"><label>Date of Birth</label><input name="dob" type="date" value={form.dob} onChange={handleChange} required /></div>
              <div className="aa-grp">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="aa-section">Account Security</div>
            <div className="aa-grp" style={{marginBottom:4}}>
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" required />
            </div>

            <button type="submit" className="aa-btn" disabled={loading}>
              {loading ? <><div className="aa-spinner"/>Creating Admin…</> : "🛡️ Create Admin Account"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddNewAdmin;