import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { useNavigate, Navigate } from "react-router-dom";
import { BASE_URL } from "../config.js";
const Login = () => {
  const {
    isAuthenticated,
    setIsAuthenticated,
    setUser,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    setAdmin,
    isDoctorAuthenticated,
    setIsDoctorAuthenticated,
    setDoctor,
  } = useContext(Context);
  const [role, setRole] = useState("Patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState("hidden");
  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("entering"));
    });
    const t = setTimeout(() => setPhase("visible"), 50);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/login`,
        { email, password, confirmPassword: password, role },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      toast.success(res.data.message);
      if (role === "Admin") {
        setIsAdminAuthenticated(true);
        setAdmin(res.data.user);
        navigate("/admin/dashboard");
      } else if (role === "Doctor") {
        setIsDoctorAuthenticated(true);
        setDoctor(res.data.user);
        navigate("/doctor/dashboard");
      } else {
        setIsAuthenticated(true);
        setUser(res.data.user);
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoRegister = (e) => {
    e.preventDefault();
    setPhase("exiting");
    setTimeout(() => navigate("/register"), 500);
  };

if (isAdminAuthenticated) return <Navigate to="/admin/dashboard" />;
  if (isDoctorAuthenticated) return <Navigate to="/doctor/dashboard" />;
  if (isAuthenticated) return <Navigate to="/" />;
  const stagger = (delay = 0) => ({
    opacity: phase === "visible" || phase === "entering" ? 1 : 0,
    transform:
      phase === "visible" || phase === "entering"
        ? "translateY(0)"
        : "translateY(20px)",
    transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  const leftSlide = {
    opacity: phase === "exiting" ? 0 : phase === "hidden" ? 0 : 1,
    transform:
      phase === "exiting"
        ? "translateX(-60px)"
        : phase === "hidden"
          ? "translateX(-60px)"
          : "translateX(0)",
    transition:
      phase === "exiting"
        ? "opacity 0.45s ease-in, transform 0.45s ease-in"
        : "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
  };

  const rightSlide = {
    opacity: phase === "exiting" ? 0 : phase === "hidden" ? 0 : 1,
    transform:
      phase === "exiting"
        ? "translateX(60px)"
        : phase === "hidden"
          ? "translateX(60px)"
          : "translateX(0)",
    transition:
      phase === "exiting"
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

        .lp-page, .lp-page * { box-sizing: border-box; }

        .lp-page {
          min-height: 100vh;
          display: flex;
          background: #f4f6f4;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }

        .lp-left {
          flex: 1.05;
          background: linear-gradient(155deg, #061a10 0%, #0b3324 50%, #103d2c 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 64px 60px;
          position: relative; overflow: hidden;
        }
        .lp-left::after {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 1px; height: 100%;
          background: linear-gradient(to bottom,
            transparent 5%,
            rgba(201,168,76,.35) 35%,
            rgba(201,168,76,.12) 70%,
            transparent 95%);
          pointer-events: none;
        }
        .lp-orb {
          position: absolute; border-radius: 50%;
          pointer-events: none; animation: orbPulse 6s ease-in-out infinite;
        }
        .lp-orb-1 { width:380px;height:380px; background:radial-gradient(circle,rgba(45,106,82,.22) 0%,transparent 65%); top:-100px;right:-100px; }
        .lp-orb-2 { width:240px;height:240px; background:radial-gradient(circle,rgba(201,168,76,.09) 0%,transparent 65%); bottom:10px;left:-60px; animation-delay:2.5s; }
        .lp-grid {
          position:absolute;inset:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);
          background-size: 44px 44px;
        }

        .lp-left-inner {
          position: relative; z-index: 1;
          text-align: center; max-width: 380px;
        }
        .lp-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px; font-weight: 700;
          color: white; letter-spacing: -.5px; margin-bottom: 4px;
        }
        .lp-logo span { color: #c9a84c; font-style: italic; }
        .lp-icon-ring {
          width: 100px; height: 100px; border-radius: 50%;
          background: rgba(255,255,255,.09);
          border: 1.5px solid rgba(255,255,255,.16);
          display: flex; align-items: center; justify-content: center;
          margin: 26px auto; font-size: 44px;
          box-shadow: 0 0 0 22px rgba(255,255,255,.03);
          animation: floatIcon 4.5s ease-in-out infinite;
        }
        .lp-left-inner h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px; font-weight: 700;
          color: white; margin-bottom: 12px; line-height: 1.25;
        }
        .lp-left-inner p {
          color: rgba(255,255,255,.55);
          font-size: 14.5px; line-height: 1.8; margin-bottom: 30px;
        }
        .lp-gold-line {
          width: 44px; height: 2px;
          background: linear-gradient(90deg, #c9a84c, #e8cc80);
          border-radius: 2px; margin: 0 auto 26px;
        }
        .lp-badges { display: flex; flex-direction: column; gap: 10px; }
        .lp-badge {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px; padding: 12px 16px;
          transition: background .2s, border-color .2s;
        }
        .lp-badge:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.18); }
        .lp-badge-icon { font-size: 18px; flex-shrink: 0; }
        .lp-badge-text { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.82); }

        .lp-right {
          flex: 0.95;
          display: flex; align-items: center; justify-content: center;
          padding: 52px 60px;
          background: #f4f6f4;
        }
        .lp-form-box { width: 100%; max-width: 420px; }
        .lp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: #e6efe9; border: 1px solid #c4d9ca;
          color: #1a6644; padding: 5px 14px;
          border-radius: 999px; font-size: 11px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          margin-bottom: 14px;
        }
        .lp-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80; animation: liveDot 2s infinite;
        }
        .lp-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px; font-weight: 700;
          color: #0b3324; line-height: 1.15; margin-bottom: 8px;
        }
        .lp-title em { font-style: italic; color: #c9a84c; }
        .lp-subtitle { color: #637a6e; font-size: 14.5px; line-height: 1.6; margin-bottom: 28px; }

        .lp-toggle {
          display: flex; gap: 3px;
          background: #dde8e1; padding: 4px;
          border-radius: 999px; border: 1px solid #c4d9ca;
          margin-bottom: 26px;
        }
        .lp-role-btn {
          flex: 1; padding: 10px 0;
          border: none; border-radius: 999px;
          font-size: 13.5px; font-weight: 600;
          cursor: pointer; background: transparent;
          color: #637a6e;
          transition: background 0.25s cubic-bezier(0.16,1,0.3,1), color 0.25s, box-shadow 0.25s;
          font-family: 'Outfit', sans-serif;
        }
        .lp-role-btn.active {
          background: linear-gradient(135deg, #1a6644, #0b3324);
          color: white; box-shadow: 0 3px 14px rgba(11,51,36,.22);
        }
        .lp-field { margin-bottom: 17px; }
        .lp-field label {
          display: block; font-size: 11px; font-weight: 700;
          color: #486057; margin-bottom: 7px;
          letter-spacing: .6px; text-transform: uppercase;
        }
        .lp-field input {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid #c4d9ca; border-radius: 10px;
          font-size: 14.5px; font-family: 'Outfit', sans-serif;
          color: #0b2a1c; background: white;
          transition: border-color .2s, box-shadow .2s; outline: none;
          appearance: none;
        }
        .lp-field input:focus {
          border-color: #1a6644;
          box-shadow: 0 0 0 3px rgba(26,102,68,.1);
        }
        .lp-field input::placeholder { color: #a8bdb4; }

        .lp-field-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 7px;
        }
        .lp-field-header label { margin-bottom: 0; }
        .lp-forgot {
          font-size: 11.5px; font-weight: 600; color: #1a6644;
          background: none; border: none; cursor: pointer;
          font-family: 'Outfit', sans-serif; padding: 0;
          transition: color .2s;
        }
        .lp-forgot:hover { color: #0b3324; text-decoration: underline; }

        .lp-submit {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1a6644 0%, #0b3324 100%);
          color: white; border: none; border-radius: 999px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Outfit', sans-serif; margin-top: 6px;
          transition: transform .3s cubic-bezier(0.16,1,0.3,1), box-shadow .3s;
          box-shadow: 0 4px 20px rgba(11,51,36,.32);
          position: relative; overflow: hidden;
        }
        .lp-submit::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.15) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: shimmer 2.6s ease-in-out infinite;
        }
        .lp-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(11,51,36,.4); }
        .lp-submit:active { transform: translateY(0); }

        .lp-foot { text-align: center; margin-top: 20px; color: #637a6e; font-size: 14px; }
        .lp-switch {
          display: inline-flex; align-items: center; gap: 5px;
          color: #1a6644; font-weight: 700;
          cursor: pointer; background: none; border: none;
          font-size: 14px; font-family: 'Outfit', sans-serif; padding: 0;
          transition: color .2s, gap .2s;
        }
        .lp-switch:hover { color: #0b3324; gap: 9px; }
        .lp-switch-arrow { display: inline-block; transition: transform .22s cubic-bezier(0.16,1,0.3,1); }
        .lp-switch:hover .lp-switch-arrow { transform: translateX(4px); }

        .lp-pw-wrap { position: relative; }
        .lp-pw-wrap input { padding-right: 46px; }
        .lp-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #7a9a8a; padding: 4px;
          display: flex; align-items: center; justify-content: center;
          transition: color .2s;
        }
        .lp-eye:hover { color: #1a6644; }

        @media(max-width:900px){
          .lp-page  { flex-direction: column; }
          .lp-left  { padding: 48px 28px; min-height: auto; }
          .lp-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="lp-page">
        {/* LEFT */}
        <div className="lp-left" style={leftSlide}>
          <div className="lp-grid" />
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-left-inner">
            <div style={stagger(100)} className="lp-logo">
              Clini<span>qo</span>
            </div>
            <div style={stagger(160)} className="lp-icon-ring">
              🏥
            </div>
            <h2 style={stagger(220)}>
              Your Health,
              <br />
              Our Priority
            </h2>
            <p style={stagger(270)}>
              Join thousands of patients across India who trust Cliniqo for
              seamless, expert healthcare.
            </p>
            <div style={stagger(300)} className="lp-gold-line" />
            <div className="lp-badges">
              <div style={stagger(330)} className="lp-badge">
                <span className="lp-badge-icon">🌿</span>
                <span className="lp-badge-text">500+ Verified Specialists</span>
              </div>
              <div style={stagger(370)} className="lp-badge">
                <span className="lp-badge-icon">⚡</span>
                <span className="lp-badge-text">Book in under 60 seconds</span>
              </div>
              <div style={stagger(410)} className="lp-badge">
                <span className="lp-badge-icon">🔒</span>
                <span className="lp-badge-text">
                  100% Secure & Confidential
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lp-right" style={rightSlide}>
          <div className="lp-form-box">
            <div style={stagger(180)} className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              Cliniqo Portal
            </div>
            <div style={stagger(220)} className="lp-title">
              Welcome <em>Back</em>
            </div>
            <p style={stagger(250)} className="lp-subtitle">
              Sign in to your account to continue your healthcare journey.
            </p>

            <div style={stagger(280)} className="lp-toggle">
              <button
                type="button"
                className={`lp-role-btn ${role === "Patient" ? "active" : ""}`}
                onClick={() => setRole("Patient")}
              >
                👤 Patient
              </button>
              <button
                type="button"
                className={`lp-role-btn ${role === "Doctor" ? "active" : ""}`}
                onClick={() => setRole("Doctor")}
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                className={`lp-role-btn ${role === "Admin" ? "active" : ""}`}
                onClick={() => setRole("Admin")}
              >
                🛡️ Admin
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <div style={stagger(320)} className="lp-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div style={stagger(360)} className="lp-field">
                <div className="lp-field-header">
                  <label>Password</label>
                  <button
                    type="button"
                    className="lp-forgot"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="lp-pw-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div style={stagger(400)}>
                <button type="submit" className="lp-submit">
                  Sign In as {role} →
                </button>
              </div>
            </form>

            {role === "Patient" && (
              <div style={stagger(440)} className="lp-foot">
                Don't have an account?{" "}
                <button className="lp-switch" onClick={handleGoRegister}>
                  Create Account <span className="lp-switch-arrow">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
