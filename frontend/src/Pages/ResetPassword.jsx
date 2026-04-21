import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("entering"), 50);
    const t2 = setTimeout(() => setPhase("visible"), 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match!");
    if (password.length < 8)
      return toast.error("Password must be at least 8 characters!");
    setLoading(true);
    try {
      const res = await axios.put(
        `https://cliniqo-backend.onrender.com/api/v1/user/login/api/v1/user/password/reset/${token}`,
        { password, confirmPassword: confirm },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      toast.success(res.data.message);
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Reset failed. Link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const s = (delay = 0) => ({
    opacity: phase === "visible" ? 1 : 0,
    transform:
      phase === "visible"
        ? "translateY(0) scale(1)"
        : "translateY(28px) scale(0.97)",
    transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  const strength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 8
          ? 2
          : password.length < 12
            ? 3
            : 4;

  const strengthColors = ["#d4e8dc", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strengthLabels = ["", "Too short", "Weak", "Good", "Strong"];
  const strengthLabelColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,700;1,700&display=swap');

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes orbPulse {
          0%,100% { transform:scale(1);   opacity:.22; }
          50%     { transform:scale(1.1); opacity:.38; }
        }
        @keyframes liveDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,.55); }
          50%     { box-shadow: 0 0 0 7px rgba(74,222,128,0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-8px); }
        }
        @keyframes successPop {
          0%   { transform: scale(0) rotate(-15deg); opacity:0; }
          60%  { transform: scale(1.2) rotate(5deg);  opacity:1; }
          80%  { transform: scale(0.92) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes ringPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.3); }
          50%     { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
        }
        @keyframes slideUp {
          from { opacity:0; transform: translateY(16px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes countdown {
          from { width: 100%; }
          to   { width: 0%; }
        }

        * { box-sizing:border-box; margin:0; padding:0; }

        .rp-page { min-height:100vh;display:flex;background:#f4f6f4;font-family:'Outfit',sans-serif;overflow:hidden; }

        .rp-left {
          flex:1.05;
          background:linear-gradient(155deg,#061a10 0%,#0b3324 50%,#103d2c 100%);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:64px 60px;position:relative;overflow:hidden;
        }
        .rp-left::after { content:'';position:absolute;top:0;right:0;width:1px;height:100%;background:linear-gradient(to bottom,transparent 5%,rgba(201,168,76,.35) 35%,rgba(201,168,76,.12) 70%,transparent 95%);pointer-events:none; }
        .rp-orb { position:absolute;border-radius:50%;pointer-events:none;animation:orbPulse 6s ease-in-out infinite; }
        .rp-orb-1 { width:380px;height:380px;background:radial-gradient(circle,rgba(45,106,82,.22) 0%,transparent 65%);top:-100px;right:-100px; }
        .rp-orb-2 { width:240px;height:240px;background:radial-gradient(circle,rgba(201,168,76,.09) 0%,transparent 65%);bottom:10px;left:-60px;animation-delay:2.5s; }
        .rp-grid { position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);background-size:44px 44px; }
        .rp-left-inner { position:relative;z-index:1;text-align:center;max-width:360px; }
        .rp-logo { font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:700;color:#fff;letter-spacing:-.5px;margin-bottom:20px; }
        .rp-logo span { color:#c9a84c;font-style:italic; }
        .rp-icon { font-size:64px;margin-bottom:24px;display:block;animation:float 4s ease-in-out infinite; }
        .rp-left-inner h2 { font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:#fff;margin-bottom:12px;line-height:1.3; }
        .rp-left-inner p { color:rgba(255,255,255,.55);font-size:14px;line-height:1.8; }
        .rp-gold-line { width:44px;height:2px;background:linear-gradient(90deg,#c9a84c,#e8cc80);border-radius:2px;margin:20px auto; }
        .rp-tip { display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;text-align:left;margin-top:10px; }
        .rp-tip-icon { font-size:16px;flex-shrink:0;margin-top:1px; }
        .rp-tip-text { font-size:12.5px;color:rgba(255,255,255,.7);line-height:1.6; }
        .rp-copy { position:absolute;bottom:20px;left:0;right:0;text-align:center;z-index:1;font-size:14px;color:rgba(255,255,255,.22);letter-spacing:.4px; }

        .rp-right { flex:0.95;display:flex;align-items:center;justify-content:center;padding:52px 60px;background:#f4f6f4; }
        .rp-form-box { width:100%;max-width:420px; }

        .rp-eyebrow { display:inline-flex;align-items:center;gap:8px;background:#e6efe9;border:1px solid #c4d9ca;color:#1a6644;padding:5px 14px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:none;margin-bottom:14px; }
        .rp-eyebrow-dot { width:6px;height:6px;border-radius:50%;background:#4ade80;animation:liveDot 2s infinite; }
        .rp-eyebrow-gold { color:#c9a84c; }

        .rp-title { font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:700;color:#0b3324;line-height:1.15;margin-bottom:8px; }
        .rp-title em { font-style:italic;color:#c9a84c; }
        .rp-subtitle { color:#637a6e;font-size:14.5px;line-height:1.6;margin-bottom:28px; }

        .rp-field { margin-bottom:17px; }
        .rp-field label { display:block;font-size:14px;font-weight:700;color:#486057;margin-bottom:7px;letter-spacing:.6px;text-transform:none; }
        .rp-field input { width:100%;padding:13px 16px;border:1.5px solid #c4d9ca;border-radius:12px;font-size:14.5px;font-family:'Outfit',sans-serif;color:#0b2a1c;background:#fff;transition:border-color .2s,box-shadow .2s,transform .2s;outline:none; }
        .rp-field input:focus { border-color:#1a6644;box-shadow:0 0 0 3px rgba(26,102,68,.1);transform:translateY(-1px); }
        .rp-field input::placeholder { color:#a8bdb4; }

        .rp-strength { display:flex;gap:5px;margin-top:8px;align-items:center; }
        .rp-strength-bar { flex:1;height:4px;border-radius:999px;background:#d4e8dc;transition:background .35s; }
        .rp-strength-label { font-size:14px;font-weight:700;min-width:55px;text-align:right;transition:color .35s; }

        .rp-submit {
          width:100%;padding:15px;
          background:linear-gradient(135deg,#1a6644 0%,#0b3324 100%);
          color:#fff;border:none;border-radius:14px;
          font-size:15px;font-weight:700;cursor:pointer;
          font-family:'Outfit',sans-serif;margin-top:6px;
          transition:transform .3s cubic-bezier(0.16,1,0.3,1),box-shadow .3s,filter .3s;
          box-shadow:0 4px 20px rgba(11,51,36,.32);
          position:relative;overflow:hidden;letter-spacing:.3px;
        }
        .rp-submit::before { content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.18) 50%,transparent 60%);background-size:200% 100%;animation:shimmer 2.6s ease-in-out infinite; }
        .rp-submit:hover { transform:translateY(-3px);box-shadow:0 12px 32px rgba(11,51,36,.42);filter:brightness(1.06); }
        .rp-submit:active { transform:translateY(0); }
        .rp-submit:disabled { opacity:.55;cursor:not-allowed;transform:none;filter:none; }

        .rp-back-btn { display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:13px;margin-top:12px;background:transparent;border:1.5px solid #c4d9ca;border-radius:14px;color:#486057;font-size:14px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:background .2s,border-color .2s,color .2s,transform .2s; }
        .rp-back-btn:hover { background:#e6efe9;border-color:#1a6644;color:#1a6644;transform:translateY(-2px); }

        .rp-success { text-align:center; }
        .rp-success-ring { width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #86efac;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;animation:successPop .6s cubic-bezier(0.16,1,0.3,1) both, ringPulse 2.5s ease-in-out 0.6s infinite;font-size:44px; }
        .rp-success-title { font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;color:#0b3324;margin-bottom:10px;animation:slideUp .5s .3s ease both; }
        .rp-success-sub { color:#637a6e;font-size:14.5px;line-height:1.7;margin-bottom:20px;animation:slideUp .5s .4s ease both; }
        .rp-success-note { background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;margin-bottom:20px;color:#166534;font-size:13px;line-height:1.6;animation:slideUp .5s .5s ease both;text-align:left; }
        .rp-countdown-bar { height:4px;background:#e6efe9;border-radius:999px;overflow:hidden;margin-bottom:20px;animation:slideUp .5s .6s ease both; }
        .rp-countdown-fill { height:100%;background:linear-gradient(90deg,#1a6644,#c9a84c);border-radius:999px;animation:countdown 3s linear forwards; }

        @media(max-width:900px){
          .rp-page  { flex-direction:column; }
          .rp-left  { padding:48px 28px;min-height:auto; }
          .rp-right { padding:40px 24px; }
        }
      `}</style>

      <div className="rp-page">
        {/* LEFT */}
        <div className="rp-left">
          <div className="rp-grid" />
          <div className="rp-orb rp-orb-1" />
          <div className="rp-orb rp-orb-2" />
          <div className="rp-left-inner">
            <div className="rp-logo">Clini<span>qo</span></div>
            <span className="rp-icon">🔐</span>
            <h2>Set Your New Password</h2>
            <p>Choose a strong password to keep your Cliniqo account secure.</p>
            <div className="rp-gold-line" />
            <div className="rp-tip">
              <span className="rp-tip-icon">💡</span>
              <span className="rp-tip-text">Use at least 8 characters with a mix of letters, numbers and symbols.</span>
            </div>
            <div className="rp-tip" style={{ marginTop: 8 }}>
              <span className="rp-tip-icon">⏱️</span>
              <span className="rp-tip-text">This reset link is valid for <strong style={{ color: "#c9a84c" }}>15 minutes</strong> only.</span>
            </div>
          </div>
          <div className="rp-copy">© 2025 Cliniqo. All rights reserved.</div>
        </div>

        {/* RIGHT */}
        <div className="rp-right">
          <div className="rp-form-box">
            {!done ? (
              <>
                <div style={s(80)} className="rp-eyebrow">
                  <span className="rp-eyebrow-dot" />
                  <span style={{ letterSpacing: 0 }}>
                    Clini<span className="rp-eyebrow-gold">qo</span> Portal
                  </span>
                </div>
                <div style={s(130)} className="rp-title">
                  Reset <em>Password</em>
                </div>
                <p style={s(170)} className="rp-subtitle">
                  Enter your new password below. Make sure it's strong and at least 8 characters.
                </p>

                <form onSubmit={handleReset}>
                  <div style={s(210)} className="rp-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                    <div className="rp-strength">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rp-strength-bar" style={{ background: i <= strength ? strengthColors[strength] : "#d4e8dc" }} />
                      ))}
                      <span className="rp-strength-label" style={{ color: strengthLabelColors[strength] }}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  </div>

                  <div style={s(260)} className="rp-field">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        borderColor:
                          confirm && confirm !== password ? "#ef4444"
                          : confirm && confirm === password ? "#22c55e" : "",
                      }}
                    />
                    {confirm && confirm !== password && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px" }}>⚠ Passwords do not match</p>
                    )}
                    {confirm && confirm === password && (
                      <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "5px" }}>✓ Passwords match</p>
                    )}
                  </div>

                  <div style={s(300)}>
                    <button type="submit" className="rp-submit" disabled={loading}>
                      {loading ? "⏳ Resetting…" : "Reset Password →"}
                    </button>
                    <button type="button" className="rp-back-btn" onClick={() => navigate("/login")}>
                      ← Back to Login
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="rp-success">
                <div className="rp-success-ring">🎉</div>
                <div className="rp-success-title">Password Reset!</div>
                <p className="rp-success-sub">Your password has been successfully updated. You can now sign in with your new password.</p>
                <div className="rp-success-note">
                  🔒 Redirecting you to login in <strong>3 seconds</strong>…
                </div>
                <div className="rp-countdown-bar">
                  <div className="rp-countdown-fill" />
                </div>
                <button className="rp-submit" onClick={() => navigate("/login")}>
                  Go to Login →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;