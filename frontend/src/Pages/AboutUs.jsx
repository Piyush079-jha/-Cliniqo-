import React, { useEffect, useRef, useState, useContext } from "react";
import { Context } from "../main";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

// ── Star helpers ─────────────────────────────────────────────────────────────
const StarDisplay = ({ rating, size = 16 }) => (
  <span style={{ display: "inline-flex", gap: "1px" }}>
    {[1,2,3,4,5].map(s => (
      <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db" }}>★</span>
    ))}
  </span>
);

const StarInput = ({ value, onChange }) => {
  const [hov, setHov] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          onMouseEnter={() => setHov(s)}
          onMouseLeave={() => setHov(0)}
          onClick={() => onChange(s)}
          style={{ fontSize: 30, color: s <= (hov || value) ? "#f59e0b" : "#d1d5db", cursor: "pointer", transition: "color .15s, transform .15s", transform: s <= (hov || value) ? "scale(1.15)" : "scale(1)" }}
        >★</span>
      ))}
    </span>
  );
};

// ── Review Card ───────────────────────────────────────────────────────────────
const ReviewCard = ({ review, currentUser, onEdit, onDelete, idx }) => {
  const isOwner = currentUser?._id && String(currentUser._id) === String(review.patientId);
  const hue = (review.patientName?.charCodeAt(0) || 65) * 7 % 360;
  return (
    <div className="rc" style={{ animationDelay: `${idx * 0.07}s` }}>
      <div className="rc-top">
        <div className="rc-avatar" style={{ background: `hsl(${hue},55%,85%)`, color: `hsl(${hue},55%,30%)` }}>
          {(review.patientName || "P")[0].toUpperCase()}
        </div>
        <div className="rc-meta">
          <span className="rc-name">{review.patientName || "Patient"}</span>
          <span className="rc-date">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <StarDisplay rating={review.rating} size={14} />
      </div>
      <p className="rc-comment">"{review.comment}"</p>
      {isOwner && (
        <div className="rc-actions">
          <button className="rc-edit" onClick={() => onEdit(review)}>✏️ Edit</button>
          <button className="rc-delete" onClick={() => onDelete(review._id)}>🗑️ Delete</button>
        </div>
      )}
    </div>
  );
};

// ── Review Form ───────────────────────────────────────────────────────────────
const ReviewForm = ({ onSubmit, initial, onCancel }) => {
  const [comment, setComment] = useState(initial?.comment || "");
  const [rating, setRating]   = useState(initial?.rating  || 5);
  const handle = (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 10) return toast.error("Comment must be at least 10 characters!");
    onSubmit({ comment, rating });
    if (!initial) { setComment(""); setRating(5); }
  };
  return (
    <form className="rv-form" onSubmit={handle}>
      <div className="rv-form-row">
        <label className="rv-label">Your Rating</label>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <textarea
        className="rv-textarea"
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience with Cliniqo... (min 10 characters)"
        maxLength={500}
        rows={4}
        required
      />
      <div className="rv-form-foot">
        <span className="rv-char">{comment.length}/500</span>
        <div style={{ display: "flex", gap: 10 }}>
          {onCancel && <button type="button" className="rv-cancel" onClick={onCancel}>Cancel</button>}
          <button type="submit" className="rv-submit">{initial ? "Update Review" : "Post Review"}</button>
        </div>
      </div>
    </form>
  );
};

// ── Animated stat counter ─────────────────────────────────────────────────────
const StatCounter = ({ end, suffix = "", duration = 1800 }) => {
  const [val, setVal]   = useState(0);
  const [vis, setVis]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!vis) return;
    let start = 0;
    const step = end / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [vis, end, duration]);

  const display = end >= 1000
    ? val.toLocaleString("en-IN")
    : val;

  return <span ref={ref}>{display}{suffix}</span>;
};

// ── Main Component ────────────────────────────────────────────────────────────
const AboutUs = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [reviews, setReviews]         = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [heroVis, setHeroVis]         = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setHeroVis(true), 80);
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get("https://cliniqo-backend.onrender.com/api/v1/review/getall", { withCredentials: true });
      setReviews(data.reviews || []);
    } catch { setReviews([]); }
  };

  const handleAdd = async ({ comment, rating }) => {
    try {
      const { data } = await axios.post("https://cliniqo-backend.onrender.com/api/v1/review/post", { comment, rating }, { withCredentials: true });
      toast.success(data.message); setShowForm(false); fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post review"); }
  };

  const handleEdit = async ({ comment, rating }) => {
    try {
      const { data } = await axios.put(`https://cliniqo-backend.onrender.com/api/v1/review/update/${editingReview._id}`, { comment, rating }, { withCredentials: true });
      toast.success(data.message); setEditingReview(null); fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update review"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const { data } = await axios.delete(`https://cliniqo-backend.onrender.com/api/v1/review/delete/${id}`, { withCredentials: true });
      toast.success(data.message); fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete review"); }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const values = [
    { icon: "🤝", title: "Patient First",             desc: "Every decision we make is centered around your wellbeing and comfort." },
    { icon: "🔬", title: "Evidence-Based Care",       desc: "Our doctors follow the latest medical research and best practices." },
    { icon: "🔒", title: "Privacy & Security",        desc: "Your health data is encrypted and protected with industry-grade security." },
    { icon: "⚡", title: "Fast & Convenient",         desc: "Book appointments in minutes, get confirmations instantly." },
    { icon: "🌏", title: "Pan-India Coverage",        desc: "Available across all major cities with 54+ verified specialists." },
    { icon: "💬", title: "Transparent Communication", desc: "Clear pricing, no hidden fees, honest medical advice always." },
  ];

  const timeline = [
    { year: "2020", title: "Founded",              desc: "Cliniqo was born from a vision to make quality healthcare accessible for every Indian." },
    { year: "2021", title: "First 100 Doctors",    desc: "We onboarded our first 100 verified specialists across 6 major cities." },
    { year: "2022", title: "1 Lakh Patients",      desc: "Crossed 1,00,000 patients served — a milestone that humbled us deeply." },
    { year: "2023", title: "9 Departments",        desc: "Expanded to 9 medical departments, covering a wide range of specializations." },
    { year: "2024", title: "54 Expert Doctors",    desc: "Growing team of rigorously verified, experienced medical professionals." },
  ];

  return (
    <>
      <style>{`
        /* ── Keyframes ── */
        @keyframes heroSlide { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse     { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes lineGrow  { from{height:0;opacity:0} to{height:100%;opacity:1} }
        @keyframes dotPop    { from{transform:scale(0)} to{transform:scale(1)} }
        @keyframes shimmer   { 0%{background-position:-400% 0} 100%{background-position:400% 0} }

        /* ── HERO ── */
        .ab-hero {
          min-height: 520px;
          background: #0d2818;
          position: relative; overflow: hidden;
          display: flex; align-items: center;
          padding: 100px 80px 80px;
        }
        .ab-hero::before {
          content: '';
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
          background-size: 56px 56px;
        }
        .ab-hero::after {
          content: '';
          position: absolute; top:0; left:0; right:0; height:3px;
          background: linear-gradient(90deg,transparent,#c9a84c,#e8cc80,#c9a84c,transparent);
        }
        .ab-hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(90px); pointer-events: none; animation: pulse 7s ease-in-out infinite;
        }
        .ab-hero-orb-1 { width:500px;height:500px;top:-150px;right:-100px;background:rgba(201,168,76,.1); }
        .ab-hero-orb-2 { width:350px;height:350px;bottom:-100px;left:5%;background:rgba(34,197,94,.07);animation-delay:3.5s; }
        .ab-hero-orb-3 { width:250px;height:250px;top:50%;left:40%;background:rgba(201,168,76,.05);animation-delay:1.5s; }

        .ab-hero-inner {
          position: relative; z-index:1;
          display: flex; align-items: center; gap: 64px;
          max-width: 1200px; width: 100%;
        }
        .ab-hero-left { flex: 1; opacity:0; }
        .ab-hero-left.vis { animation: heroSlide .9s cubic-bezier(.22,1,.36,1) forwards; }

        .ab-hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(201,168,76,.12);
          border: 1px solid rgba(201,168,76,.3);
          color: #c9a84c; padding: 6px 16px; border-radius: 999px;
          font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
          text-transform: uppercase; margin-bottom: 22px;
        }
        .ab-hero-tag-dot { width:6px;height:6px;border-radius:50%;background:#c9a84c;animation:pulse 2s infinite; }

        .ab-hero-left h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px,5vw,58px); line-height:1.08;
          color: white; margin:0 0 20px; font-weight:700;
        }
        .ab-hero-left h1 em { font-style:italic;color:#c9a84c; }
        .ab-hero-left p {
          color: #7aab90; font-size:16px; line-height:1.8;
          max-width:480px; margin:0 0 36px;
        }
        .ab-hero-btns { display:flex;gap:14px;flex-wrap:wrap; }
        .ab-hero-btn-primary {
          padding:13px 28px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#c9a84c,#e8cc80);
          color:#0d2818; font-size:14px; font-weight:800;
          cursor:pointer; font-family:"Outfit",sans-serif;
          transition:transform .2s,box-shadow .2s;
          box-shadow:0 4px 16px rgba(201,168,76,.35);
          text-decoration:none; display:inline-flex; align-items:center; gap:6px;
        }
        .ab-hero-btn-primary:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(201,168,76,.45); }
        .ab-hero-btn-ghost {
          padding:13px 28px; border-radius:12px;
          border:1.5px solid rgba(255,255,255,.2);
          color:rgba(255,255,255,.85); font-size:14px; font-weight:700;
          cursor:pointer; font-family:"Outfit",sans-serif; background:transparent;
          transition:all .2s; text-decoration:none;
          display:inline-flex; align-items:center; gap:6px;
        }
        .ab-hero-btn-ghost:hover { background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.4); }

        /* Hero right card */
        .ab-hero-right { flex-shrink:0; width:380px; opacity:0; }
        .ab-hero-right.vis { animation: heroSlide .9s .15s cubic-bezier(.22,1,.36,1) forwards; }
        .ab-brand-card {
          position:relative; border-radius:28px; overflow:hidden;
          box-shadow:0 0 0 1px rgba(201,168,76,.25), 0 32px 80px rgba(0,0,0,.55);
          animation: floatY 6s ease-in-out infinite;
        }
        .ab-brand-card-inner {
          background:linear-gradient(160deg,#071810 0%,#0e2a1c 45%,#163d29 100%);
          position:relative; overflow:hidden;
        }
        .ab-brand-card-inner::before {
          content:'';position:absolute;inset:0;
          background-image:radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px);
          background-size:20px 20px; pointer-events:none;
        }
        .ab-card-topbar {
          height:3px;width:100%;
          background:linear-gradient(90deg,transparent,#c9a84c,#e8cc80,#c9a84c,transparent);
        }
        .ab-card-header {
          display:flex;align-items:center;gap:14px;
          padding:22px 22px 18px;position:relative;z-index:1;
          border-bottom:1px solid rgba(255,255,255,.06);
        }
        .ab-card-icon {
          width:54px;height:54px;border-radius:14px;flex-shrink:0;
          background:linear-gradient(135deg,#1a4a2e,#2d6a4f);
          border:1.5px solid rgba(201,168,76,.35);
          display:flex;align-items:center;justify-content:center;font-size:24px;
          box-shadow:0 0 0 5px rgba(201,168,76,.07),0 6px 20px rgba(0,0,0,.4);
        }
        .ab-card-name {
          font-family:'Cormorant Garamond',serif;
          font-size:22px;font-weight:700;color:white;line-height:1.1;margin-bottom:3px;
        }
        .ab-card-name em { color:#c9a84c;font-style:italic; }
        .ab-card-sub {
          font-size:10px;color:rgba(255,255,255,.4);letter-spacing:1.8px;text-transform:uppercase;
        }
        .ab-card-stats {
          display:grid;grid-template-columns:repeat(3,1fr);
          position:relative;z-index:1;
        }
        .ab-card-stat {
          padding:18px 12px;text-align:center;
          border-right:1px solid rgba(255,255,255,.06);
          border-bottom:1px solid rgba(255,255,255,.06);
          transition:background .2s;
        }
        .ab-card-stat:last-child{border-right:none;}
        .ab-card-stat:hover{background:rgba(255,255,255,.04);}
        .ab-card-stat-val {
          font-size:20px;font-weight:800;color:white;
          font-family:"Outfit",sans-serif;line-height:1;margin-bottom:4px;
        }
        .ab-card-stat-val em{color:#c9a84c;font-style:normal;}
        .ab-card-stat-lbl {
          font-size:9px;color:rgba(255,255,255,.4);
          font-weight:700;letter-spacing:.6px;text-transform:uppercase;
        }
        .ab-card-features { position:relative;z-index:1; }
        .ab-card-feat {
          display:flex;align-items:center;gap:12px;
          padding:12px 22px;border-top:1px solid rgba(255,255,255,.05);
          transition:background .2s;
        }
        .ab-card-feat:hover{background:rgba(255,255,255,.04);}
        .ab-card-feat-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;flex-shrink:0;animation:pulse 2s infinite;}
        .ab-card-feat-dot.gold{background:#c9a84c;}
        .ab-card-feat-dot.blue{background:#60a5fa;}
        .ab-card-feat-text{font-size:13px;color:rgba(255,255,255,.7);font-weight:500;flex:1;}
        .ab-card-feat-badge{
          font-size:11px;font-weight:700;color:#c9a84c;
          background:rgba(201,168,76,.1);padding:2px 10px;
          border-radius:999px;border:1px solid rgba(201,168,76,.2);white-space:nowrap;
        }

        /* ── STATS ── */
        .ab-stats {
          display:grid;grid-template-columns:repeat(4,1fr);
          background:var(--bg-card);
          border-bottom:1px solid var(--border);
        }
        .ab-stat {
          padding:36px 24px;text-align:center;
          border-right:1px solid var(--border);
          position:relative; overflow:hidden;
          transition:background .25s;
        }
        .ab-stat:last-child{border-right:none;}
        .ab-stat:hover{background:var(--bg-alt);}
        .ab-stat::after {
          content:'';
          position:absolute;bottom:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,#1a3d2e,#2d6a4f);
          transform:scaleX(0);transform-origin:left;
          transition:transform .3s ease;
        }
        .ab-stat:hover::after{transform:scaleX(1);}
        .ab-stat-num {
          font-size:38px;font-weight:800;color:#1a3d2e;
          font-family:"Outfit",sans-serif;line-height:1;margin-bottom:6px;
        }
        .ab-stat-lbl {
          font-size:11px;color:var(--text-gray);
          font-weight:700;text-transform:uppercase;letter-spacing:.8px;
        }

        /* ── MISSION ── */
        .ab-mission {
          padding:88px 80px;
          background:var(--bg-alt);
          display:flex;gap:72px;align-items:center;
        }
        .ab-mission-left { flex:1; }
        .ab-section-tag {
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(26,61,46,.08);border:1px solid rgba(26,61,46,.15);
          color:#1a3d2e;padding:5px 14px;border-radius:999px;
          font-size:11px;font-weight:800;letter-spacing:1.2px;
          text-transform:uppercase;margin-bottom:18px;
        }
        .ab-section-tag-dot{width:5px;height:5px;border-radius:50%;background:#1a3d2e;}
        .ab-mission-left h2 {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(28px,3.5vw,44px);font-weight:700;
          color:var(--text-dark);line-height:1.15;margin:0 0 20px;
        }
        .ab-mission-left h2 em{color:#1a3d2e;font-style:italic;}
        .ab-mission-left p {
          color:var(--text-gray);font-size:15px;line-height:1.85;margin:0 0 16px;
        }
        .ab-mission-right { flex:1; }
        .ab-mission-highlights {
          display:grid;grid-template-columns:1fr 1fr;gap:16px;
        }
        .ab-highlight {
          background:var(--bg-card);border-radius:16px;padding:22px;
          border:1.5px solid var(--border);
          transition:transform .25s,box-shadow .25s,border-color .25s;
          animation:cardIn .5s ease both;
        }
        .ab-highlight:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(26,61,46,.1);border-color:#1a3d2e;}
        .ab-highlight-icon{font-size:28px;margin-bottom:10px;}
        .ab-highlight h4{font-size:15px;font-weight:800;color:var(--text-dark);font-family:"Outfit",sans-serif;margin:0 0 6px;}
        .ab-highlight p{font-size:13px;color:var(--text-gray);margin:0;line-height:1.6;}

        /* ── TIMELINE ── */
        .ab-timeline-section {
          padding:88px 80px;
          background:var(--bg-card);
        }
        .ab-timeline-section h2 {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(28px,3.5vw,42px);font-weight:700;
          color:var(--text-dark);margin:0 0 8px;
        }
        .ab-timeline-section h2 em{color:#1a3d2e;font-style:italic;}
        .ab-timeline-sub{color:var(--text-gray);font-size:15px;margin:0 0 56px;}
        .ab-timeline {
          position:relative;max-width:800px;
        }
        .ab-timeline::before {
          content:'';
          position:absolute;left:20px;top:8px;bottom:8px;width:2px;
          background:linear-gradient(to bottom,#1a3d2e,rgba(26,61,46,.1));
          animation:lineGrow .8s .2s ease both;
        }
        .ab-tl-item {
          display:flex;gap:32px;align-items:flex-start;
          padding:0 0 40px 0;position:relative;
          animation:fadeUp .5s ease both;
        }
        .ab-tl-item:nth-child(1){animation-delay:.1s}
        .ab-tl-item:nth-child(2){animation-delay:.2s}
        .ab-tl-item:nth-child(3){animation-delay:.3s}
        .ab-tl-item:nth-child(4){animation-delay:.4s}
        .ab-tl-item:nth-child(5){animation-delay:.5s}
        .ab-tl-dot {
          width:42px;height:42px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,#1a3d2e,#2d6a4f);
          border:3px solid white;
          box-shadow:0 0 0 3px #1a3d2e,0 4px 16px rgba(26,61,46,.3);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:12px;font-weight:800;
          animation:dotPop .4s ease both;
          z-index:1;position:relative;
        }
        .ab-tl-content{padding-top:8px;}
        .ab-tl-year{
          font-size:12px;font-weight:800;color:#1a3d2e;
          letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;
        }
        .ab-tl-title{
          font-size:18px;font-weight:800;color:var(--text-dark);
          font-family:"Outfit",sans-serif;margin-bottom:6px;
        }
        .ab-tl-desc{font-size:14px;color:var(--text-gray);line-height:1.7;margin:0;}

        /* ── VALUES ── */
        .ab-values {
          padding:88px 80px;
          background:var(--bg-alt);
        }
        .ab-values-header{margin-bottom:48px;}
        .ab-values-header h2{
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(28px,3.5vw,44px);font-weight:700;
          color:var(--text-dark);margin:0 0 10px;
        }
        .ab-values-header h2 em{color:#1a3d2e;font-style:italic;}
        .ab-values-header p{color:var(--text-gray);font-size:15px;margin:0;}
        .ab-values-grid{
          display:grid;grid-template-columns:repeat(3,1fr);gap:20px;
        }
        .ab-val {
          background:var(--bg-card);border-radius:18px;padding:28px;
          border:1.5px solid var(--border);
          transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s,border-color .28s;
          position:relative;overflow:hidden;
          animation:cardIn .5s ease both;
        }
        .ab-val:nth-child(1){animation-delay:.05s}
        .ab-val:nth-child(2){animation-delay:.10s}
        .ab-val:nth-child(3){animation-delay:.15s}
        .ab-val:nth-child(4){animation-delay:.20s}
        .ab-val:nth-child(5){animation-delay:.25s}
        .ab-val:nth-child(6){animation-delay:.30s}
        .ab-val:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(26,61,46,.12);border-color:#1a3d2e;}
        .ab-val-icon{
          width:52px;height:52px;border-radius:14px;
          background:rgba(26,61,46,.08);border:1px solid rgba(26,61,46,.12);
          display:flex;align-items:center;justify-content:center;
          font-size:26px;margin-bottom:18px;
          transition:transform .25s;
        }
        .ab-val:hover .ab-val-icon{transform:scale(1.1) rotate(-5deg);}
        .ab-val h4{font-size:17px;font-weight:800;color:var(--text-dark);font-family:"Outfit",sans-serif;margin:0 0 8px;}
        .ab-val p{font-size:13px;color:var(--text-gray);line-height:1.7;margin:0;}

        /* ── REVIEWS ── */
        .ab-reviews {
          padding:88px 80px;
          background:var(--bg-card);
        }
        .ab-reviews-head {
          display:flex;justify-content:space-between;align-items:flex-end;
          margin-bottom:40px;flex-wrap:wrap;gap:20px;
        }
        .ab-reviews-head h2{
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(28px,3.5vw,44px);font-weight:700;
          color:var(--text-dark);margin:0 0 10px;
        }
        .ab-reviews-head h2 em{color:#1a3d2e;font-style:italic;}
        .ab-reviews-head p{color:var(--text-gray);font-size:15px;margin:0;}
        .ab-rating-badge {
          display:flex;align-items:center;gap:16px;
          padding:16px 24px;background:var(--bg-alt);
          border-radius:16px;border:1.5px solid var(--border);
          flex-shrink:0;
        }
        .ab-rating-num{
          font-size:42px;font-weight:800;color:#1a3d2e;
          font-family:"Outfit",sans-serif;line-height:1;
        }
        .ab-rating-info{display:flex;flex-direction:column;gap:3px;}
        .ab-write-btn {
          padding:11px 24px;border-radius:12px;
          border:1.5px solid #1a3d2e;
          color:#1a3d2e;background:transparent;cursor:pointer;
          font-size:13px;font-weight:700;font-family:"Outfit",sans-serif;
          transition:all .2s;flex-shrink:0;
        }
        .ab-write-btn:hover{background:#1a3d2e;color:white;}

        /* Review form */
        .rv-form{
          background:var(--bg-alt);border-radius:18px;padding:24px;
          border:1.5px solid var(--border);margin-bottom:32px;
          animation:fadeUp .3s ease;
        }
        .rv-form-row{display:flex;align-items:center;gap:16px;margin-bottom:14px;}
        .rv-label{font-size:13px;font-weight:700;color:var(--text-dark);}
        .rv-textarea{
          width:100%;padding:14px;border-radius:12px;
          border:1.5px solid var(--border);background:var(--bg-card);
          color:var(--text-dark);font-size:14px;font-family:"Outfit",sans-serif;
          resize:vertical;outline:none;box-sizing:border-box;
          transition:border-color .2s,box-shadow .2s;
        }
        .rv-textarea:focus{border-color:#1a3d2e;box-shadow:0 0 0 3px rgba(26,61,46,.1);}
        .rv-form-foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;}
        .rv-char{font-size:11px;color:var(--text-gray);}
        .rv-submit{
          padding:10px 24px;background:#1a3d2e;border:none;border-radius:10px;
          color:white;font-size:13px;font-weight:700;cursor:pointer;
          font-family:"Outfit",sans-serif;transition:opacity .2s,transform .2s;
        }
        .rv-submit:hover{opacity:.85;transform:translateY(-1px);}
        .rv-cancel{
          padding:10px 20px;background:transparent;
          border:1.5px solid var(--border);border-radius:10px;
          color:var(--text-gray);font-size:13px;font-weight:600;cursor:pointer;
          font-family:"Outfit",sans-serif;transition:all .2s;
        }
        .rv-cancel:hover{background:var(--bg-alt);}

        /* Login prompt */
        .ab-login-prompt{
          padding:20px 24px;background:var(--bg-alt);border-radius:14px;
          border:1.5px dashed var(--border);font-size:14px;color:var(--text-gray);
          margin-bottom:32px;text-align:center;
        }
        .ab-login-prompt a{color:#1a3d2e;font-weight:700;text-decoration:underline;}

        /* Review cards */
        .ab-reviews-grid{
          display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;
        }
        .rc{
          background:var(--bg-alt);border-radius:16px;padding:22px;
          border:1px solid var(--border);
          transition:transform .25s,box-shadow .25s;
          animation:cardIn .4s ease both;
        }
        .rc:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.08);}
        .rc-top{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
        .rc-avatar{
          width:42px;height:42px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:16px;flex-shrink:0;
        }
        .rc-meta{flex:1;}
        .rc-name{display:block;font-size:14px;font-weight:700;color:var(--text-dark);}
        .rc-date{display:block;font-size:11px;color:var(--text-gray);}
        .rc-comment{
          font-size:14px;color:var(--text-gray);line-height:1.75;
          margin:0;font-style:italic;
        }
        .rc-actions{
          display:flex;gap:8px;margin-top:14px;
          padding-top:12px;border-top:1px solid var(--border);
        }
        .rc-edit{
          padding:5px 14px;border-radius:8px;
          border:1px solid var(--border);background:transparent;
          font-size:12px;font-weight:600;cursor:pointer;color:var(--text-gray);
          font-family:"Outfit",sans-serif;transition:all .2s;
        }
        .rc-edit:hover{background:var(--bg-card);color:var(--text-dark);}
        .rc-delete{
          padding:5px 14px;border-radius:8px;
          border:1px solid #fecaca;background:transparent;
          font-size:12px;font-weight:600;cursor:pointer;color:#ef4444;
          font-family:"Outfit",sans-serif;transition:all .2s;
        }
        .rc-delete:hover{background:#fef2f2;}
        .ab-empty{
          text-align:center;padding:56px 0;color:var(--text-gray);
          display:flex;flex-direction:column;align-items:center;gap:10px;
        }
        .ab-empty-icon{font-size:48px;opacity:.4;}

        /* ── Responsive ── */
        @media(max-width:1024px){
          .ab-hero{padding:90px 40px 72px;}
          .ab-mission{padding:72px 40px;gap:48px;}
          .ab-timeline-section,.ab-values,.ab-reviews{padding:72px 40px;}
          .ab-stats{grid-template-columns:repeat(2,1fr);}
          .ab-stat:nth-child(2){border-right:none;}
          .ab-stat:nth-child(3){border-top:1px solid var(--border);}
          .ab-stat:nth-child(4){border-top:1px solid var(--border);}
        }
        @media(max-width:768px){
          .ab-hero{padding:80px 24px 60px;}
          .ab-hero-inner{flex-direction:column;gap:40px;}
          .ab-hero-right{width:100%;}
          .ab-mission{padding:60px 24px;flex-direction:column;gap:40px;}
          .ab-mission-highlights{grid-template-columns:1fr;}
          .ab-timeline-section,.ab-values,.ab-reviews{padding:60px 24px;}
          .ab-values-grid{grid-template-columns:1fr 1fr;}
          .ab-reviews-head{flex-direction:column;align-items:flex-start;}
          .ab-reviews-grid{grid-template-columns:1fr;}
        }
        @media(max-width:480px){
          .ab-values-grid{grid-template-columns:1fr;}
          .ab-stats{grid-template-columns:1fr 1fr;}
        }
      `}</style>

      <div style={{ paddingTop: "70px" }}>

        {/* ── HERO ── */}
        <section className="ab-hero">
          <div className="ab-hero-orb ab-hero-orb-1" />
          <div className="ab-hero-orb ab-hero-orb-2" />
          <div className="ab-hero-orb ab-hero-orb-3" />
          <div className="ab-hero-inner">
            <div className={`ab-hero-left ${heroVis ? "vis" : ""}`}>
              <div className="ab-hero-tag">
                <span className="ab-hero-tag-dot" />
                Our Story
              </div>
              <h1>Redefining<br /><em>Healthcare</em><br />in India</h1>
              <p>
                We're on a mission to make quality healthcare accessible to every Indian —
                through technology, trust, and compassion. Cliniqo connects you with
                verified specialists in seconds.
              </p>
              <div className="ab-hero-btns">
                <Link to="/appointment" className="ab-hero-btn-primary">📅 Book Appointment</Link>
                <Link to="/doctors" className="ab-hero-btn-ghost">🩺 Meet Our Doctors</Link>
              </div>
            </div>
            <div className={`ab-hero-right ${heroVis ? "vis" : ""}`}>
              <div className="ab-brand-card">
                <div className="ab-brand-card-inner">
                  <div className="ab-card-topbar" />
                  {/* Header */}
                  <div className="ab-card-header">
                    <div className="ab-card-icon">🏥</div>
                    <div>
                      <div className="ab-card-name">Clini<em>qo</em></div>
                      <div className="ab-card-sub">Trusted Healthcare Partner</div>
                    </div>
                  </div>
                  {/* Stats mini grid */}
                  <div className="ab-card-stats">
                    {[
                      { val: "1.5L+", lbl: "Patients" },
                      { val: "54+",   lbl: "Doctors"  },
                      { val: <><em>4.9</em>★</>, lbl: "Rating"   },
                    ].map((s, i) => (
                      <div className="ab-card-stat" key={i}>
                        <div className="ab-card-stat-val">{s.val}</div>
                        <div className="ab-card-stat-lbl">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  {/* Features */}
                  <div className="ab-card-features">
                    <div className="ab-card-feat">
                      <span className="ab-card-feat-dot" />
                      <span className="ab-card-feat-text">Verified Specialist Doctors</span>
                      <span className="ab-card-feat-badge">✓ Certified</span>
                    </div>
                    <div className="ab-card-feat">
                      <span className="ab-card-feat-dot gold" />
                      <span className="ab-card-feat-text">Instant Appointment Booking</span>
                      <span className="ab-card-feat-badge">24/7</span>
                    </div>
                    <div className="ab-card-feat">
                      <span className="ab-card-feat-dot blue" />
                      <span className="ab-card-feat-text">Pan-India Coverage</span>
                      <span className="ab-card-feat-badge">🇮🇳 All Cities</span>
                    </div>
                    <div className="ab-card-feat">
                      <span className="ab-card-feat-dot" style={{background:"#f472b6"}} />
                      <span className="ab-card-feat-text">Secure Health Records</span>
                      <span className="ab-card-feat-badge">🔒 Safe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="ab-stats">
          {[
            { end: 150000, suffix: "+",  label: "Patients Served",    prefix: "" },
            { end: 54,     suffix: "+",  label: "Specialist Doctors", prefix: "" },
            { end: 9,      suffix: "",   label: "Departments",        prefix: "" },
            { end: 49,     suffix: "★",  label: "Average Rating",     prefix: "4." },
          ].map((s, i) => (
            <div className="ab-stat" key={i}>
              <div className="ab-stat-num">
                {s.prefix}<StatCounter end={s.end} suffix={s.suffix} />
              </div>
              <div className="ab-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── MISSION ── */}
        <section className="ab-mission">
          <div className="ab-mission-left">
            <div className="ab-section-tag">
              <span className="ab-section-tag-dot" />
              Our Mission
            </div>
            <h2>Healthcare that puts <em>you first</em></h2>
            <p>
              Cliniqo was founded on a simple belief — every Indian deserves access to
              quality medical care without the usual barriers of long waits, confusing
              processes, or unclear pricing.
            </p>
            <p>
              We bridge the gap between patients and verified specialists through a
              seamless, transparent platform built on trust and compassion.
            </p>
          </div>
          <div className="ab-mission-right">
            <div className="ab-mission-highlights">
              {[
                { icon: "🎯", title: "Our Vision",    desc: "A healthier India where quality care is a right, not a privilege." },
                { icon: "💡", title: "Our Approach",  desc: "Technology-driven, human-centered care that respects your time." },
                { icon: "🤝", title: "Our Promise",   desc: "Verified doctors, transparent pricing, zero hidden surprises." },
                { icon: "🌱", title: "Our Impact",    desc: "1,50,000+ lives improved — and growing every single day." },
              ].map((h, i) => (
                <div className="ab-highlight" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="ab-highlight-icon">{h.icon}</div>
                  <h4>{h.title}</h4>
                  <p>{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section className="ab-timeline-section">
          <div className="ab-section-tag"><span className="ab-section-tag-dot" />Our Journey</div>
          <h2>How we <em>grew</em></h2>
          <p className="ab-timeline-sub">From a small idea to a trusted healthcare platform.</p>
          <div className="ab-timeline">
            {timeline.map((t, i) => (
              <div className="ab-tl-item" key={i}>
                <div className="ab-tl-dot" style={{ animationDelay: `${i * 0.12}s` }}>{t.year.slice(2)}</div>
                <div className="ab-tl-content">
                  <div className="ab-tl-year">{t.year}</div>
                  <div className="ab-tl-title">{t.title}</div>
                  <p className="ab-tl-desc">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="ab-values">
          <div className="ab-values-header">
            <div className="ab-section-tag"><span className="ab-section-tag-dot" />Why Choose Us</div>
            <h2>Our <em>Core Values</em></h2>
            <p>Everything we do is guided by these principles.</p>
          </div>
          <div className="ab-values-grid">
            {values.map((v, i) => (
              <div className="ab-val" key={i}>
                <div className="ab-val-icon">{v.icon}</div>
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section className="ab-reviews">
          <div className="ab-reviews-head">
            <div>
              <div className="ab-section-tag"><span className="ab-section-tag-dot" />Patient Reviews</div>
              <h2>What Our Patients <em>Say</em></h2>
              <p>Real experiences from people we've had the privilege to serve.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="ab-rating-badge">
                <span className="ab-rating-num">{avgRating}</span>
                <div className="ab-rating-info">
                  <StarDisplay rating={parseFloat(avgRating)} size={18} />
                  <span style={{ fontSize: 12, color: "var(--text-gray)" }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              {isAuthenticated && !showForm && !editingReview && (
                <button className="ab-write-btn" onClick={() => setShowForm(true)}>✍️ Write a Review</button>
              )}
            </div>
          </div>

          {!isAuthenticated && (
            <div className="ab-login-prompt">
              <Link to="/login">Sign in</Link> to share your experience with Cliniqo 💚
            </div>
          )}
          {isAuthenticated && showForm && (
            <ReviewForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
          )}
          {editingReview && (
            <ReviewForm initial={editingReview} onSubmit={handleEdit} onCancel={() => setEditingReview(null)} />
          )}

          {reviews.length === 0 ? (
            <div className="ab-empty">
              <div className="ab-empty-icon">💬</div>
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="ab-reviews-grid">
              {reviews.map((rev, i) => (
                <ReviewCard
                  key={rev._id} review={rev} idx={i}
                  currentUser={user}
                  onEdit={setEditingReview}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
};

export default AboutUs;
