import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("entering"), 50);
    const t2 = setTimeout(() => setPhase("visible"), 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/v1/user/password/forgot",
        { email },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      toast.success(res.data.message);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong!");
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

        * { box-sizing:border-box; margin:0; padding:0; }

        .fp-page {
          min-height:100vh; display:flex;
          background:#f4f6f4; font-family:'Outfit',sans-serif; overflow:hidden;
        }

        .fp-left {
          flex:1.05;
          background:linear-gradient(155deg,#061a10 0%,#0b3324 50%,#103d2c 100%);
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:64px 60px; position:relative; overflow:hidden;
        }
        .fp-left::after {
          content:''; position:absolute; top:0; right:0;
          width:1px; height:100%;
          background:linear-gradient(to bottom,transparent 5%,rgba(201,168,76,.35) 35%,rgba(201,168,76,.12) 70%,transparent 95%);
          pointer-events:none;
        }
        .fp-orb { position:absolute; border-radius:50%; pointer-events:none; animation:orbPulse 6s ease-in-out infinite; }
        .fp-orb-1 { width:380px;height:380px;background:radial-gradient(circle,rgba(45,106,82,.22) 0%,transparent 65%);top:-100px;right:-100px; }
        .fp-orb-2 { width:240px;height:240px;background:radial-gradient(circle,rgba(201,168,76,.09) 0%,transparent 65%);bottom:10px;left:-60px;animation-delay:2.5s; }
        .fp-grid {
          position:absolute;inset:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);
          background-size:44px 44px;
        }
        .fp-left-inner { position:relative;z-index:1;text-align:center;max-width:360px; }
        .fp-logo {
          font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:700;
          color:#fff;letter-spacing:-.5px;margin-bottom:20px;
          display:inline-block;
        }
        .fp-logo span { color:#c9a84c;font-style:italic; }
        .fp-icon { font-size:64px;margin-bottom:24px;display:block;animation:float 4s ease-in-out infinite; }
        .fp-left-inner h2 { font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:#fff;margin-bottom:12px;line-height:1.3; }
        .fp-left-inner p { color:rgba(255,255,255,.55);font-size:14px;line-height:1.8; }
        .fp-gold-line { width:44px;height:2px;background:linear-gradient(90deg,#c9a84c,#e8cc80);border-radius:2px;margin:20px auto; }
        .fp-tip { display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;text-align:left;margin-top:10px; }
        .fp-tip-icon { font-size:16px;flex-shrink:0;margin-top:1px; }
        .fp-tip-text { font-size:12.5px;color:rgba(255,255,255,.7);line-height:1.6; }
        .fp-copy { position:absolute;bottom:20px;left:0;right:0;text-align:center;z-index:1;font-size:14px;color:rgba(255,255,255,.22);letter-spacing:.4px; }

        .fp-right { flex:0.95;display:flex;align-items:center;justify-content:center;padding:52px 60px;background:#f4f6f4; }
        .fp-form-box { width:100%;max-width:420px; }

        .fp-eyebrow { display:inline-flex;align-items:center;gap:8px;background:#e6efe9;border:1px solid #c4d9ca;color:#1a6644;padding:5px 14px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:none;margin-bottom:14px; }
        .fp-eyebrow-dot { width:6px;height:6px;border-radius:50%;background:#4ade80;animation:liveDot 2s infinite; }
        .fp-eyebrow-gold { color:#c9a84c; }

        .fp-title { font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:700;color:#0b3324;line-height:1.15;margin-bottom:8px; }
        .fp-title em { font-style:italic;color:#c9a84c; }
        .fp-subtitle { color:#637a6e;font-size:14.5px;line-height:1.6;margin-bottom:28px; }

        .fp-field { margin-bottom:17px; }
        .fp-field label { display:block;font-size:14px;font-weight:700;color:#486057;margin-bottom:7px;letter-spacing:.6px;text-transform:none; }
        .fp-field input { width:100%;padding:13px 16px;border:1.5px solid #c4d9ca;border-radius:12px;font-size:14.5px;font-family:'Outfit',sans-serif;color:#0b2a1c;background:#fff;transition:border-color .2s,box-shadow .2s,transform .2s;outline:none; }
        .fp-field input:focus { border-color:#1a6644;box-shadow:0 0 0 3px rgba(26,102,68,.1);transform:translateY(-1px); }
        .fp-field input::placeholder { color:#a8bdb4; }

        .fp-submit {
          width:100%;padding:15px;
          background:linear-gradient(135deg,#1a6644 0%,#0b3324 100%);
          color:#fff;border:none;border-radius:14px;
          font-size:15px;font-weight:700;cursor:pointer;
          font-family:'Outfit',sans-serif;margin-top:6px;
          transition:transform .3s cubic-bezier(0.16,1,0.3,1),box-shadow .3s,filter .3s;
          box-shadow:0 4px 20px rgba(11,51,36,.32);
          position:relative;overflow:hidden;letter-spacing:.3px;
        }
        .fp-submit::before {
          content:'';position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.18) 50%,transparent 60%);
          background-size:200% 100%;
          animation:shimmer 2.6s ease-in-out infinite;
        }
        .fp-submit:hover { transform:translateY(-3px);box-shadow:0 12px 32px rgba(11,51,36,.42);filter:brightness(1.06); }
        .fp-submit:active { transform:translateY(0);box-shadow:0 4px 12px rgba(11,51,36,.3); }
        .fp-submit:disabled { opacity:.55;cursor:not-allowed;transform:none;filter:none; }

        .fp-back-btn {
          display:flex;align-items:center;justify-content:center;gap:7px;
          width:100%;padding:13px;margin-top:12px;
          background:transparent;border:1.5px solid #c4d9ca;border-radius:14px;
          color:#486057;font-size:14px;font-weight:600;cursor:pointer;
          font-family:'Outfit',sans-serif;
          transition:background .2s,border-color .2s,color .2s,transform .2s;
        }
        .fp-back-btn:hover { background:#e6efe9;border-color:#1a6644;color:#1a6644;transform:translateY(-2px); }

        .fp-success { text-align:center; }
        .fp-success-ring {
          width:96px;height:96px;border-radius:50%;
          background:linear-gradient(135deg,#dcfce7,#bbf7d0);
          border:2px solid #86efac;
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 24px;
          animation:successPop .6s cubic-bezier(0.16,1,0.3,1) both, ringPulse 2.5s ease-in-out 0.6s infinite;
          font-size:44px;
        }
        .fp-success-title { font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;color:#0b3324;margin-bottom:10px;animation:slideUp .5s .3s ease both; }
        .fp-success-sub { color:#637a6e;font-size:14.5px;line-height:1.7;margin-bottom:20px;animation:slideUp .5s .4s ease both; }
        .fp-success-email {
          display:inline-flex;align-items:center;gap:8px;
          background:linear-gradient(135deg,#e6efe9,#d1fae5);
          border:1.5px solid #86efac;
          color:#0b3324;padding:10px 22px;border-radius:999px;
          font-size:13.5px;font-weight:700;margin-bottom:24px;
          animation:slideUp .5s .5s ease both;
          box-shadow:0 2px 12px rgba(26,102,68,.12);
        }
        .fp-success-note { background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;margin-bottom:24px;color:#166534;font-size:13px;line-height:1.6;animation:slideUp .5s .6s ease both;text-align:left; }
        .fp-try-link {
          display:inline-flex;align-items:center;gap:5px;
          color:#637a6e;font-size:13px;font-weight:600;
          background:none;border:none;cursor:pointer;
          font-family:'Outfit',sans-serif;padding:0;margin-top:8px;
          transition:color .2s,gap .2s;text-decoration:underline;text-underline-offset:3px;
        }
        .fp-try-link:hover { color:#1a6644;gap:8px; }

        @media(max-width:900px){
          .fp-page  { flex-direction:column; }
          .fp-left  { padding:48px 28px;min-height:auto; }
          .fp-right { padding:40px 24px; }
        }
      `}</style>

      <div className="fp-page">
        {/* LEFT */}
        <div className="fp-left">
          <div className="fp-grid" />
          <div className="fp-orb fp-orb-1" />
          <div className="fp-orb fp-orb-2" />
          <div className="fp-left-inner">
            <div className="fp-logo">
              Clini<span>qo</span>
            </div>
            <span className="fp-icon">📧</span>
            <h2>Forgot Your Password?</h2>
            <p>
              No worries — we'll send a secure reset link straight to your
              inbox.
            </p>
            <div className="fp-gold-line" />
            <div className="fp-tip">
              <span className="fp-tip-icon">💡</span>
              <span className="fp-tip-text">
                Check your spam/junk folder if you don't see the email within a
                few minutes.
              </span>
            </div>
            <div className="fp-tip" style={{ marginTop: 8 }}>
              <span className="fp-tip-icon">⏱️</span>
              <span className="fp-tip-text">
                The reset link expires in{" "}
                <strong style={{ color: "#c9a84c" }}>15 minutes</strong>.
              </span>
            </div>
          </div>
          <div className="fp-copy">© 2025 Cliniqo. All rights reserved.</div>
        </div>

        {/* RIGHT */}
        <div className="fp-right">
          <div className="fp-form-box">
            {!sent ? (
              <>
                <div style={s(80)} className="fp-eyebrow">
                  <span className="fp-eyebrow-dot" />
                  <span style={{ letterSpacing: 0 }}>
                    Clini<span className="fp-eyebrow-gold">qo</span> Portal
                  </span>
                </div>
                <div style={s(130)} className="fp-title">
                  Forgot <em>Password?</em>
                </div>
                <p style={s(170)} className="fp-subtitle">
                  Enter the email address linked to your Cliniqo account and
                  we'll send you a password reset link.
                </p>
                <form onSubmit={handleSubmit}>
                  <div style={s(210)} className="fp-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <div style={s(250)}>
                    <button
                      type="submit"
                      className="fp-submit"
                      disabled={loading}
                    >
                      {loading ? "⏳ Sending…" : "Send Reset Link →"}
                    </button>
                    <button
                      type="button"
                      className="fp-back-btn"
                      onClick={() => navigate("/login")}
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="fp-success">
                <div className="fp-success-ring">✅</div>
                <div className="fp-success-title">Check Your Inbox!</div>
                <p className="fp-success-sub">
                  We've sent a password reset link to:
                </p>
                <div className="fp-success-email">
                  <span>📬</span> {email}
                </div>
                <div className="fp-success-note">
                  📌 Click the link in the email to set a new password. The link
                  will expire in <strong>15 minutes</strong>. If you don't see
                  it, check your spam folder.
                </div>
                <button
                  className="fp-submit"
                  onClick={() => navigate("/login")}
                >
                  ← Back to Login
                </button>
                <br />
                <button
                  className="fp-try-link"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Try a different email →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
