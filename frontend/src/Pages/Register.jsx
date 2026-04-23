import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { useNavigate, Navigate } from "react-router-dom";

const Register = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);
  const [form, setForm]   = useState({ firstName:"", lastName:"", email:"", phone:"", dob:"", gender:"", password:"" });
  const [age, setAge]     = useState(null);
  const [phase, setPhase] = useState("hidden");
  const navigate          = useNavigate();

  useEffect(() => {
    // Clear any existing session cookie so fresh registration is possible
    document.cookie = "patientToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
    setIsAuthenticated(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase("entering")));
    const t = setTimeout(() => setPhase("visible"), 50);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "dob" && value) {
      const today = new Date();
      const birth = new Date(value);
      let years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
      setAge(years >= 0 ? years : null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clear old session first
      await axios.get(
        "https://cliniqo-backend.onrender.com/api/v1/user/logout",
        { withCredentials: true }
      );
    } catch (_) {}
    try {
      const res = await axios.post(
        "https://cliniqo-backend.onrender.com/api/v1/user/patient/register",
        form,
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      toast.success(res.data.message + " Please log in.");
      setIsAuthenticated(false);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const handleGoLogin = (e) => {
    e.preventDefault();
    setPhase("exiting");
    setTimeout(() => navigate("/login"), 500);
  };

  if (isAuthenticated) return <Navigate to="/" />;

  const stagger = (delay = 0) => ({
    opacity:    phase === "visible" || phase === "entering" ? 1 : 0,
    transform:  phase === "visible" || phase === "entering" ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  const leftSlide = {
    opacity:    phase === "exiting" ? 0 : phase === "hidden" ? 0 : 1,
    transform:  phase === "exiting" ? "translateX(-60px)" : phase === "hidden" ? "translateX(-60px)" : "translateX(0)",
    transition: phase === "exiting"
      ? "opacity 0.45s ease-in, transform 0.45s ease-in"
      : "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
  };

  const rightSlide = {
    opacity:    phase === "exiting" ? 0 : phase === "hidden" ? 0 : 1,
    transform:  phase === "exiting" ? "translateX(60px)" : phase === "hidden" ? "translateX(60px)" : "translateX(0)",
    transition: phase === "exiting"
      ? "opacity 0.45s ease-in, transform 0.45s ease-in"
      : "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s",
  };

  return (
    <>
      <style>{`
        @keyframes floatIcon {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-9px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes orbPulse {
          0%,100% { transform: scale(1);   opacity: .22; }
          50%     { transform: scale(1.1); opacity: .38; }
        }
        @keyframes liveDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,.55); }
          50%     { box-shadow: 0 0 0 7px rgba(74,222,128,0); }
        }
        @keyframes agePop {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1);   opacity: 1; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-page {
          min-height: 100vh;
          display: flex;
          background: #f4f6f4;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }

        .rp-left {
          width: 340px; flex-shrink: 0;
          background: linear-gradient(155deg, #061a10 0%, #0b3324 50%, #103d2c 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 44px;
          position: relative; overflow: hidden;
        }
        .rp-left::after {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 1px; height: 100%;
          background: linear-gradient(to bottom,
            transparent 5%, rgba(201,168,76,.35) 35%,
            rgba(201,168,76,.12) 70%, transparent 95%);
          pointer-events: none;
        }
        .rp-orb { position:absolute;border-radius:50%;pointer-events:none;animation:orbPulse 6s ease-in-out infinite; }
        .rp-orb-1 { width:280px;height:280px;background:radial-gradient(circle,rgba(45,106,82,.22) 0%,transparent 65%);top:-60px;right:-60px; }
        .rp-orb-2 { width:180px;height:180px;background:radial-gradient(circle,rgba(201,168,76,.09) 0%,transparent 65%);bottom:30px;left:-30px;animation-delay:2.5s; }
        .rp-grid {
          position:absolute;inset:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);
          background-size:44px 44px;
        }
        .rp-left-inner { position:relative;z-index:1;text-align:center; }
        .rp-logo { font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;color:white;letter-spacing:-.5px;margin-bottom:4px; }
        .rp-logo span { color:#c9a84c;font-style:italic; }
        .rp-icon-ring {
          width:88px;height:88px;border-radius:50%;
          background:rgba(255,255,255,.09);border:1.5px solid rgba(255,255,255,.16);
          display:flex;align-items:center;justify-content:center;
          margin:22px auto;font-size:38px;
          box-shadow:0 0 0 18px rgba(255,255,255,.03);
          animation:floatIcon 4.5s ease-in-out infinite;
        }
        .rp-left-inner h2 { font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:700;color:white;margin-bottom:12px;line-height:1.3; }
        .rp-left-inner p { color:rgba(255,255,255,.55);font-size:13.5px;line-height:1.75;margin-bottom:26px; }
        .rp-gold-line { width:40px;height:2px;background:linear-gradient(90deg,#c9a84c,#e8cc80);border-radius:2px;margin:0 auto 22px; }
        .rp-badges { display:flex;flex-direction:column;gap:9px; }
        .rp-badge {
          display:flex;align-items:center;gap:10px;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
          border-radius:10px;padding:10px 13px;
          transition:background .2s,border-color .2s;
        }
        .rp-badge:hover { background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.18); }
        .rp-badge-icon { font-size:16px;flex-shrink:0; }
        .rp-badge-text { font-size:12.5px;font-weight:600;color:rgba(255,255,255,.82); }

        .rp-right {
          flex:1;display:flex;align-items:flex-start;justify-content:center;
          padding:48px 56px;background:#f4f6f4;overflow-y:auto;
        }
        .rp-form-box { width:100%;max-width:560px;padding-top:20px; }

        .rp-eyebrow {
          display:inline-flex;align-items:center;gap:8px;
          background:#e6efe9;border:1px solid #c4d9ca;
          color:#1a6644;padding:5px 14px;
          border-radius:999px;font-size:11px;font-weight:700;
          letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;
        }
        .rp-eyebrow-dot { width:6px;height:6px;border-radius:50%;background:#4ade80;animation:liveDot 2s infinite; }
        .rp-title { font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;color:#0b3324;line-height:1.15;margin-bottom:6px; }
        .rp-title em { font-style:italic;color:#c9a84c; }
        .rp-subtitle { color:#637a6e;font-size:14px;line-height:1.6;margin-bottom:26px; }

        .rp-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:15px; }
        .rp-field { margin-bottom:15px; }
        .rp-field label { display:block;font-size:11px;font-weight:700;color:#486057;margin-bottom:7px;letter-spacing:.6px;text-transform:uppercase; }
        .rp-field input,
        .rp-field select {
          width:100%;padding:11px 14px;
          border:1.5px solid #c4d9ca;border-radius:10px;
          font-size:14px;font-family:'Outfit',sans-serif;
          color:#0b2a1c;background:white;
          transition:border-color .2s,box-shadow .2s;outline:none;
          appearance:none;
        }
        .rp-field input:focus,
        .rp-field select:focus { border-color:#1a6644;box-shadow:0 0 0 3px rgba(26,102,68,.1); }
        .rp-field input::placeholder { color:#a8bdb4; }
        .rp-field select option { background:white;color:#0b2a1c; }

        /* Age display box */
        .rp-age-box {
          display: flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #e6efe9, #f0f7f2);
          border: 1.5px solid #1a6644;
          border-radius: 10px; padding: 11px 14px;
          animation: agePop 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .rp-age-number {
          font-size: 22px; font-weight: 800;
          color: #1a6644; line-height: 1;
          font-family: 'Cormorant Garamond', serif;
        }
        .rp-age-label {
          font-size: 12px; font-weight: 600;
          color: #486057; line-height: 1.3;
        }
        .rp-age-label span {
          display: block; font-size: 10px;
          color: #8aab98; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .rp-age-empty {
          width: 100%; padding: 11px 14px;
          border: 1.5px dashed #c4d9ca; border-radius: 10px;
          font-size: 13px; color: #a8bdb4;
          background: white; text-align: center;
        }

        .rp-submit {
          width:100%;padding:14px;
          background:linear-gradient(135deg,#1a6644 0%,#0b3324 100%);
          color:white;border:none;border-radius:999px;
          font-size:15px;font-weight:700;cursor:pointer;
          font-family:'Outfit',sans-serif;margin-top:4px;
          transition:transform .3s cubic-bezier(0.16,1,0.3,1),box-shadow .3s;
          box-shadow:0 4px 20px rgba(11,51,36,.32);
          position:relative;overflow:hidden;
        }
        .rp-submit::after {
          content:'';position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.15) 50%,transparent 60%);
          background-size:200% 100%;
          animation:shimmer 2.6s ease-in-out infinite;
        }
        .rp-submit:hover { transform:translateY(-2px);box-shadow:0 10px 30px rgba(11,51,36,.4); }
        .rp-submit:active { transform:translateY(0); }

        .rp-foot { text-align:center;margin-top:18px;color:#637a6e;font-size:14px; }
        .rp-switch {
          display:inline-flex;align-items:center;gap:5px;
          color:#1a6644;font-weight:700;
          cursor:pointer;background:none;border:none;
          font-size:14px;font-family:'Outfit',sans-serif;padding:0;
          transition:color .2s,gap .2s;
        }
        .rp-switch:hover { color:#0b3324;gap:9px; }
        .rp-switch-arrow { display:inline-block;transition:transform .22s cubic-bezier(0.16,1,0.3,1); }
        .rp-switch:hover .rp-switch-arrow { transform:translateX(-4px); }

        @media(max-width:900px){
          .rp-page{flex-direction:column;}
          .rp-left{width:100%;padding:44px 28px;min-height:auto;}
          .rp-right{padding:36px 20px;}
          .rp-grid-2{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="rp-page">

        <div className="rp-left" style={leftSlide}>
          <div className="rp-grid" />
          <div className="rp-orb rp-orb-1" />
          <div className="rp-orb rp-orb-2" />
          <div className="rp-left-inner">
            <div style={stagger(100)} className="rp-logo">Clini<span>qo</span></div>
            <div style={stagger(150)} className="rp-icon-ring">🩺</div>
            <h2 style={stagger(200)}>Join India's<br/>Trusted Healthcare</h2>
            <p style={stagger(245)}>Create your free account and get access to 500+ top doctors across 25+ specialities.</p>
            <div style={stagger(275)} className="rp-gold-line" />
            <div className="rp-badges">
              <div style={stagger(305)} className="rp-badge"><span className="rp-badge-icon">🌿</span><span className="rp-badge-text">Free first consultation</span></div>
              <div style={stagger(340)} className="rp-badge"><span className="rp-badge-icon">📅</span><span className="rp-badge-text">Book in 60 seconds</span></div>
              <div style={stagger(375)} className="rp-badge"><span className="rp-badge-icon">🔒</span><span className="rp-badge-text">Private & secure</span></div>
            </div>
          </div>
        </div>

        <div className="rp-right" style={rightSlide}>
          <div className="rp-form-box">
            <div style={stagger(160)} className="rp-eyebrow"><span className="rp-eyebrow-dot" />Get Started</div>
            <div style={stagger(200)} className="rp-title">Create Your <em>Account</em></div>
            <p style={stagger(230)} className="rp-subtitle">Join Cliniqo and get access to India's finest healthcare network.</p>

            <form onSubmit={handleSubmit}>
              <div style={stagger(260)} className="rp-grid-2">
                <div className="rp-field"><label>First Name</label><input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" required /></div>
                <div className="rp-field"><label>Last Name</label><input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" required /></div>
              </div>

              <div style={stagger(295)} className="rp-grid-2">
                <div className="rp-field"><label>Email Address</label><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required /></div>
                <div className="rp-field"><label>Phone Number</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="9631163498" required /></div>
              </div>

              {/* DOB + Age side by side */}
              <div style={stagger(325)} className="rp-grid-2">
                <div className="rp-field">
                  <label>Date of Birth</label>
                  <input name="dob" type="date" value={form.dob} onChange={handleChange} required />
                </div>
                <div className="rp-field">
                  <label>Age</label>
                  {age !== null ? (
                    <div className="rp-age-box">
                      <div className="rp-age-number">{age}</div>
                      <div className="rp-age-label">
                        Years Old
                      </div>
                    </div>
                  ) : (
                    <div className="rp-age-empty">Enter DOB to calculate</div>
                  )}
                </div>
              </div>

              <div style={stagger(355)} className="rp-grid-2">
                <div className="rp-field">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="rp-field">
                  <label>Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" required />
                </div>
              </div>

              <div style={stagger(385)}>
                <button type="submit" className="rp-submit">Register Now →</button>
              </div>
            </form>

            <div style={stagger(415)} className="rp-foot">
              Already have an account?{" "}
              <button className="rp-switch" onClick={handleGoLogin}>
                <span className="rp-switch-arrow">←</span> Sign In
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Register;
