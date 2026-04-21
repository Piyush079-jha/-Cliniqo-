import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const departments = [
  { name: "Cardiology",       emoji: "❤️",  desc: "Heart & cardiovascular",      accent: "#f43f5e", bg: "#fff1f2", light: "#ffe4e6" },
  { name: "Neurology",        emoji: "🧠",  desc: "Brain & nervous system",       accent: "#a855f7", bg: "#faf5ff", light: "#f3e8ff" },
  { name: "Oncology",         emoji: "🎗️", desc: "Cancer care & treatment",      accent: "#3b82f6", bg: "#eff6ff", light: "#dbeafe" },
  { name: "Radiology",        emoji: "🔬",  desc: "Imaging & diagnostics",        accent: "#14b8a6", bg: "#f0fdfa", light: "#ccfbf1" },
  { name: "Pediatrics",       emoji: "👶",  desc: "Child healthcare specialists", accent: "#f59e0b", bg: "#fffbeb", light: "#fef3c7" },
  { name: "Orthopedics",      emoji: "🦴",  desc: "Bone & joint care",            accent: "#22c55e", bg: "#f0fdf4", light: "#dcfce7" },
  { name: "Physical Therapy", emoji: "🏃",  desc: "Rehabilitation services",      accent: "#f97316", bg: "#fff7ed", light: "#ffedd5" },
  { name: "Dermatology",      emoji: "✨",  desc: "Skin care specialists",        accent: "#c026d3", bg: "#fdf4ff", light: "#fae8ff" },
  { name: "ENT",              emoji: "👂",  desc: "Ear, Nose & Throat",           accent: "#06b6d4", bg: "#ecfeff", light: "#cffafe" },
];

const getDoctorAvatar = (doctor) => {
  const name = `${doctor.firstName}+${doctor.lastName}`;
  const bg   = doctor.gender === "Female" ? "c026d3" : "1a3d2e";
  return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=128&bold=true&rounded=true`;
};

const useInView = (threshold = 0.12) => {
  const ref  = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const DoctorCard = ({ doc, dept, onBook }) => {
  return (
    <div className="adept-doc-card" style={{ "--accent": dept.accent, "--acc-bg": dept.bg }}>
      <div className="adept-doc-avatar-wrap">
        <img
          src={doc.docAvatar?.url || getDoctorAvatar(doc)}
          alt={`Dr. ${doc.firstName}`}
          onError={(e) => { e.target.src = getDoctorAvatar(doc); }}
        />
      </div>
      <div className="adept-doc-meta">
        <p className="adept-doc-name">Dr. {doc.firstName} {doc.lastName}</p>
        <p className="adept-doc-role">{dept.name} Specialist</p>
      </div>
      <button className="adept-book-btn" onClick={() => onBook(doc)}>
        Book <span className="btn-arrow">→</span>
      </button>
    </div>
  );
};

const DeptSection = ({ dept, doctors, index }) => {
  const navigate = useNavigate();
  const [sectionRef, inView] = useInView();
  const [expanded, setExpanded] = useState(false);
  const deptDoctors = doctors.filter(d => d.doctorDepartment === dept.name);
  const shown = expanded ? deptDoctors : deptDoctors.slice(0, 4);

  const handleBook = (doc) => {
    navigate(`/appointment?department=${encodeURIComponent(doc.doctorDepartment)}&doctor_firstName=${encodeURIComponent(doc.firstName)}&doctor_lastName=${encodeURIComponent(doc.lastName)}`);
  };

  return (
    <div
      ref={sectionRef}
      className={`adept-section ${inView ? "adept-in" : ""}`}
      style={{ animationDelay: `${(index % 3) * 80}ms` }}
    >
      <div className="adept-stripe" style={{ background: dept.accent }} />
      <div className="adept-section-inner">
        <div className="adept-header">
          <div className="adept-icon-wrap" style={{ background: dept.light, color: dept.accent }}>
            <span>{dept.emoji}</span>
          </div>
          <div className="adept-header-text">
            <h2 className="adept-dept-name">{dept.name}</h2>
            <p className="adept-dept-desc">{dept.desc}</p>
          </div>
          <div className="adept-badge" style={{ background: `${dept.accent}18`, color: dept.accent }}>
            <span className="adept-badge-dot" style={{ background: dept.accent }} />
            {deptDoctors.length} {deptDoctors.length === 1 ? "Doctor" : "Doctors"}
          </div>
        </div>
        <div className="adept-divider" style={{ background: `${dept.accent}20` }} />
        {deptDoctors.length === 0 ? (
          <p className="adept-empty">No doctors available yet.</p>
        ) : (
          <>
            <div className="adept-doctors-grid">
              {shown.map((doc, i) => (
                <div key={doc._id} className="adept-card-wrap" style={{ animationDelay: inView ? `${i * 60}ms` : "0ms" }}>
                  <DoctorCard doc={doc} dept={dept} onBook={handleBook} />
                </div>
              ))}
            </div>
            {deptDoctors.length > 4 && (
              <button
                className="adept-toggle-btn"
                style={{ color: dept.accent, borderColor: `${dept.accent}40` }}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "↑ Show Less" : `+ Show ${deptDoctors.length - 4} More`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AllDepartments = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get("https://cliniqo-backend.onrender.com/api/v1/user/login/api/v1/user/doctors")
      .then(res => { setDoctors(res.data.doctors); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? departments : departments.filter(d => d.name === filter);

  return (
    <>
      <style>{`
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sectionFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGold {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes filterPop {
          0%   { transform: scale(0.92); }
          60%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }

        /* ── Hero ── */
        .adept-hero {
          padding: 90px 80px 60px;
          background: linear-gradient(140deg, #0d2418 0%, #1a3d2e 55%, #21533c 100%);
          position: relative; overflow: hidden;
        }
        /* ✅ Square grid pattern matching appointment hero */
        .adept-hero::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .adept-hero::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, #c9a84c 30%, #e8cc80 50%, #c9a84c 70%, transparent 100%);
          animation: pulseGold 3s ease-in-out infinite;
        }
        .adept-hero-orb {
          position: absolute; right: -100px; top: -100px;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .adept-hero-orb2 {
          position: absolute; left: 40%; bottom: -80px;
          width: 240px; height: 240px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .adept-hero-inner {
          position: relative; z-index: 1; max-width: 1200px; margin: 0 auto;
          animation: heroSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        .adept-hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.18);
          color: #e8cc80; padding: 5px 16px; border-radius: 999px;
          font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; margin-bottom: 20px;
        }
        .adept-hero-tag-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #c9a84c;
          animation: pulseGold 2s ease-in-out infinite;
        }
        .adept-hero h1 {
          color: white; font-size: clamp(30px, 4vw, 46px);
          font-family: "Cormorant Garamond", "Georgia", serif;
          font-weight: 700; margin: 0 0 14px; line-height: 1.15;
          letter-spacing: -0.5px;
        }
        .adept-hero h1 em { color: #c9a84c; font-style: italic; }
        .adept-hero-sub {
          color: rgba(255,255,255,0.65); font-size: 15px; line-height: 1.7;
          max-width: 480px; margin: 0 0 32px;
        }
        .adept-hero-stats {
          display: flex; gap: 12px; flex-wrap: wrap;
        }
        .adept-hero-stat {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 12px; padding: 10px 18px;
          animation: heroSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        .adept-hero-stat:nth-child(1) { animation-delay: 0.1s; }
        .adept-hero-stat:nth-child(2) { animation-delay: 0.18s; }
        .adept-hero-stat:nth-child(3) { animation-delay: 0.26s; }
        .adept-hero-stat-num {
          font-size: 20px; font-weight: 800; color: white; line-height: 1;
          font-family: "Outfit", sans-serif;
        }
        .adept-hero-stat-label {
          font-size: 11px; color: rgba(255,255,255,0.55);
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }
        .adept-hero-stat-icon { font-size: 20px; }

        /* ── Filter Bar ── */
        .adept-filter-bar {
          background: var(--bg-card, #fff);
          border-bottom: 1px solid var(--border, #e5e7eb);
          padding: 0 80px;
          position: sticky; top: 68px; z-index: 10;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .adept-filter-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; gap: 4px; overflow-x: auto;
          padding: 12px 0; scrollbar-width: none;
        }
        .adept-filter-inner::-webkit-scrollbar { display: none; }
        .adept-filter-pill {
          padding: 7px 18px; border-radius: 999px; border: 1.5px solid transparent;
          font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap;
          font-family: "Outfit", sans-serif; transition: all 0.2s;
          background: var(--bg-alt, #f9fafb); color: var(--text-gray, #6b7280);
          flex-shrink: 0;
        }
        .adept-filter-pill:hover { border-color: #1a3d2e; color: #1a3d2e; }
        .adept-filter-pill.active {
          background: #1a3d2e; color: white; border-color: #1a3d2e;
          animation: filterPop 0.25s ease;
        }

        /* ── Body ── */
        .adept-body {
          padding: 48px 80px 80px;
          background: var(--bg-alt, #f5f7f5);
          position: relative;
        }
        /* ✅ Square grid pattern on body section too */
        .adept-body::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }
        .adept-body-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }

        /* ── Section Card ── */
        .adept-section {
          background: var(--bg-card, #fff);
          border-radius: 20px;
          border: 1.5px solid var(--border, #e5e7eb);
          margin-bottom: 24px;
          display: flex;
          overflow: hidden;
          opacity: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .adept-section:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .adept-section.adept-in {
          animation: sectionFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .adept-stripe { width: 4px; flex-shrink: 0; border-radius: 4px 0 0 4px; }
        .adept-section-inner { flex: 1; padding: 26px 28px; }
        .adept-header { display: flex; align-items: center; gap: 16px; margin-bottom: 0; }
        .adept-icon-wrap {
          width: 50px; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0; transition: transform 0.3s ease;
        }
        .adept-section:hover .adept-icon-wrap { transform: rotate(-5deg) scale(1.08); }
        .adept-header-text { flex: 1; min-width: 0; }
        .adept-dept-name {
          font-size: 17px; font-weight: 800; margin: 0 0 2px;
          color: var(--text-dark, #111); font-family: "Outfit", sans-serif;
        }
        .adept-dept-desc { font-size: 12px; color: var(--text-gray, #6b7280); margin: 0; }
        .adept-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 999px;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
          font-family: "Outfit", sans-serif;
        }
        .adept-badge-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .adept-divider { height: 1px; margin: 18px 0; border-radius: 99px; }
        .adept-doctors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 10px;
        }
        .adept-card-wrap {
          opacity: 0;
          animation: cardSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .adept-section.adept-in .adept-card-wrap { opacity: 1; }
        .adept-doc-card {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 13px; border-radius: 12px;
          border: 1.5px solid var(--border, #e5e7eb);
          background: var(--bg-alt, #f9fafb);
          transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
          cursor: default;
        }
        .adept-doc-card:hover {
          box-shadow: 0 4px 18px rgba(0,0,0,0.09);
          transform: translateY(-2px);
          border-color: var(--accent);
          background: var(--acc-bg);
        }
        .adept-doc-avatar-wrap {
          width: 42px; height: 42px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
          border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .adept-doc-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .adept-doc-meta { flex: 1; min-width: 0; }
        .adept-doc-name {
          font-size: 12.5px; font-weight: 700;
          color: var(--text-dark, #111); margin: 0 0 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .adept-doc-role { font-size: 11px; color: var(--text-gray, #6b7280); margin: 0; }
        .adept-book-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 12px; border-radius: 999px;
          font-size: 11px; font-weight: 700; cursor: pointer;
          font-family: "Outfit", sans-serif;
          background: transparent;
          color: var(--accent); border: 1.5px solid currentColor;
          transition: background 0.2s, color 0.2s, transform 0.2s;
          white-space: nowrap; flex-shrink: 0;
        }
        .adept-book-btn:hover { background: var(--accent); color: white; transform: translateY(-1px); }
        .adept-book-btn .btn-arrow { transition: transform 0.2s; display: inline-block; }
        .adept-book-btn:hover .btn-arrow { transform: translateX(3px); }
        .adept-toggle-btn {
          margin-top: 14px; background: none;
          border: 1.5px solid; border-radius: 999px;
          padding: 7px 18px; font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: "Outfit", sans-serif;
          transition: background 0.2s, color 0.2s;
        }
        .adept-toggle-btn:hover { opacity: 0.75; }
        .adept-empty { color: var(--text-gray, #6b7280); font-size: 13px; margin: 0; }
        .adept-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 340px; gap: 16px;
        }
        .adept-spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid #e5e7eb; border-top-color: #1a3d2e;
          animation: spin 0.7s linear infinite;
        }
        .adept-loading-text { font-size: 14px; color: var(--text-gray, #6b7280); }
        .adept-section-meta {
          font-size: 12px; color: var(--text-gray, #6b7280);
          margin-bottom: 24px; font-weight: 600; letter-spacing: 0.3px;
        }
        .adept-section-meta span { color: #1a3d2e; font-weight: 800; }

        @media (max-width: 900px) {
          .adept-hero { padding: 72px 24px 48px; }
          .adept-filter-bar { padding: 0 16px; }
          .adept-body { padding: 28px 16px 64px; }
          .adept-hero-stats { gap: 8px; }
          .adept-hero-stat { padding: 8px 12px; }
        }
        @media (max-width: 600px) {
          .adept-doctors-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="adept-hero" style={{ paddingTop: "90px" }}>
        <div className="adept-hero-orb" />
        <div className="adept-hero-orb2" />
        <div className="adept-hero-inner">
          <div className="adept-hero-tag">
            <span className="adept-hero-tag-dot" /> Specialities
          </div>
          <h1>All <em>Departments</em></h1>
          <p className="adept-hero-sub">
            Explore our full range of medical specialities and meet the specialists available in each department.
          </p>
          <div className="adept-hero-stats">
            <div className="adept-hero-stat">
              <span className="adept-hero-stat-icon">🏥</span>
              <div>
                <div className="adept-hero-stat-num">9</div>
                <div className="adept-hero-stat-label">Departments</div>
              </div>
            </div>
            <div className="adept-hero-stat">
              <span className="adept-hero-stat-icon">👨‍⚕️</span>
              <div>
                <div className="adept-hero-stat-num">54+</div>
                <div className="adept-hero-stat-label">Specialists</div>
              </div>
            </div>
            <div className="adept-hero-stat">
              <span className="adept-hero-stat-icon">⭐</span>
              <div>
                <div className="adept-hero-stat-num">4.9</div>
                <div className="adept-hero-stat-label">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="adept-filter-bar">
        <div className="adept-filter-inner">
          <button
            className={`adept-filter-pill ${filter === "All" ? "active" : ""}`}
            onClick={() => setFilter("All")}
          >All</button>
          {departments.map(d => (
            <button
              key={d.name}
              className={`adept-filter-pill ${filter === d.name ? "active" : ""}`}
              onClick={() => setFilter(d.name)}
            >{d.emoji} {d.name}</button>
          ))}
        </div>
      </div>

      <section className="adept-body">
        <div className="adept-body-inner">
          {loading ? (
            <div className="adept-loading">
              <div className="adept-spinner" />
              <p className="adept-loading-text">Loading departments…</p>
            </div>
          ) : (
            <>
              <p className="adept-section-meta">
                Showing <span>{filtered.length}</span> of <span>{departments.length}</span> departments
              </p>
              {filtered.map((dept, i) => (
                <DeptSection key={dept.name} dept={dept} doctors={doctors} index={i} />
              ))}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default AllDepartments;