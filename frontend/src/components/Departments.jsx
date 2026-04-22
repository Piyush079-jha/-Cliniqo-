import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const departments = [
  {
    name: "Cardiology",
    emoji: "❤️",
    desc: "Heart & cardiovascular care",
    accent: "#f43f5e",
    bg: "#fff1f2",
    light: "#ffe4e6",
    count: "12 Specialists",
  },
  {
    name: "Neurology",
    emoji: "🧠",
    desc: "Brain & nervous system",
    accent: "#a855f7",
    bg: "#faf5ff",
    light: "#f3e8ff",
    count: "8 Specialists",
  },
  {
    name: "Oncology",
    emoji: "🎗️",
    desc: "Cancer care & treatment",
    accent: "#3b82f6",
    bg: "#eff6ff",
    light: "#dbeafe",
    count: "6 Specialists",
  },
  {
    name: "Radiology",
    emoji: "🔬",
    desc: "Imaging & diagnostics",
    accent: "#14b8a6",
    bg: "#f0fdfa",
    light: "#ccfbf1",
    count: "5 Specialists",
  },
  {
    name: "Pediatrics",
    emoji: "👶",
    desc: "Child healthcare experts",
    accent: "#f59e0b",
    bg: "#fffbeb",
    light: "#fef3c7",
    count: "9 Specialists",
  },
  {
    name: "Orthopedics",
    emoji: "🦴",
    desc: "Bone & joint care",
    accent: "#22c55e",
    bg: "#f0fdf4",
    light: "#dcfce7",
    count: "7 Specialists",
  },
  {
    name: "Physical Therapy",
    emoji: "🏃",
    desc: "Rehabilitation services",
    accent: "#f97316",
    bg: "#fff7ed",
    light: "#ffedd5",
    count: "4 Specialists",
  },
  {
    name: "Dermatology",
    emoji: "✨",
    desc: "Skin, hair & nail care",
    accent: "#c026d3",
    bg: "#fdf4ff",
    light: "#fae8ff",
    count: "6 Specialists",
  },
  {
    name: "ENT",
    emoji: "👂",
    desc: "Ear, Nose & Throat",
    accent: "#06b6d4",
    bg: "#ecfeff",
    light: "#cffafe",
    count: "5 Specialists",
  },
];

const useInView = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const Departments = () => {
  const navigate = useNavigate();
  const [sectionRef, inView] = useInView();
  const [hovered, setHovered] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        @keyframes dsFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dsTileIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dsGoldPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }

        /* ── SECTION SHELL ── */
        .ds-section {
          padding: 72px 80px 80px;
          background: linear-gradient(180deg, #f0f8f4 0%, #e8f5ee 100%);
          position: relative;
          overflow: hidden;
          border-top: 1px solid #d4e8dc;
          border-bottom: 1px solid #d4e8dc;
        }
        .ds-section::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(26,61,46,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,61,46,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .ds-section-blob {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(26,61,46,0.06) 0%, transparent 70%);
          top: -180px; right: -120px;
          pointer-events: none;
        }

        /* ── HEADER ── */
        .ds-header {
          display: flex; align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          position: relative; z-index: 1;
          opacity: 0;
        }
        .ds-header.ds-in {
          animation: dsFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.05s both;
        }
        .ds-header-left {}
        .ds-tag {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(26,61,46,0.08);
          border: 1px solid rgba(26,61,46,0.18);
          color: #1a3d2e; padding: 4px 14px; border-radius: 999px;
          font-size: 10px; font-weight: 800; letter-spacing: 1.8px;
          text-transform: uppercase; margin-bottom: 14px;
          font-family: "Outfit", sans-serif;
        }
        .ds-tag-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #1a3d2e;
          animation: dsGoldPulse 2s ease-in-out infinite;
        }
        .ds-title {
          font-size: clamp(26px, 3vw, 36px);
          font-weight: 800; color: #0d2618; line-height: 1.1;
          letter-spacing: -0.5px; margin: 0 0 10px;
          font-family: "Outfit", sans-serif;
        }
        .ds-title em { font-style: italic; color: #1a6644; font-weight: 800; }
        .ds-subtitle {
          font-size: 14px; color: #5a7a66; line-height: 1.7;
          max-width: 400px; margin: 0; font-family: "Outfit", sans-serif;
        }
        .ds-view-all {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px; border-radius: 999px;
          border: 1.5px solid #1a3d2e; background: transparent;
          color: #1a3d2e; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: "Outfit", sans-serif;
          transition: all 0.22s cubic-bezier(0.22,1,0.36,1);
          white-space: nowrap; flex-shrink: 0;
        }
        .ds-view-all:hover {
          background: #1a3d2e; color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26,61,46,0.25);
        }
        .ds-view-all-arrow { transition: transform 0.2s; display: inline-block; }
        .ds-view-all:hover .ds-view-all-arrow { transform: translateX(4px); }

        /* ── GRID ── */
        .ds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          position: relative; z-index: 1;
        }

        /* ── TILE ── */
        .ds-tile {
          background: #fff;
          border: 1.5px solid #e4ede8;
          border-radius: 18px;
          padding: 22px 18px 20px;
          cursor: pointer;
          display: flex; flex-direction: column; gap: 0;
          position: relative; overflow: hidden;
          transition: all 0.28s cubic-bezier(0.22,1,0.36,1);
          opacity: 0;
          text-decoration: none;
        }
        .ds-tile.ds-tile-in {
          animation: dsTileIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .ds-tile:hover {
          border-color: var(--ac);
          box-shadow: 0 12px 36px rgba(0,0,0,0.1);
          transform: translateY(-5px);
          background: var(--lc);
        }

        /* top accent line */
        .ds-tile-accent {
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px; border-radius: 18px 18px 0 0;
          background: var(--ac);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .ds-tile:hover .ds-tile-accent { transform: scaleX(1); }

        /* icon box */
        .ds-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin-bottom: 16px;
          background: var(--lc);
          border: 1px solid var(--bc);
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
          flex-shrink: 0;
        }
        .ds-tile:hover .ds-icon {
          transform: scale(1.1) rotate(-6deg);
        }

        /* name */
        .ds-name {
          font-size: 14px; font-weight: 800;
          color: #1a2d22; margin: 0 0 5px;
          font-family: "Outfit", sans-serif;
          transition: color 0.2s; line-height: 1.2;
        }
        .ds-tile:hover .ds-name { color: var(--ac); }

        /* desc */
        .ds-desc {
          font-size: 11.5px; color: #7a9986; font-weight: 500;
          margin: 0 0 14px; line-height: 1.45;
          font-family: "Outfit", sans-serif;
        }

        /* count pill */
        .ds-count {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 10.5px; font-weight: 700;
          background: var(--lc); color: var(--ac);
          border: 1px solid var(--bc);
          font-family: "Outfit", sans-serif;
          width: fit-content; margin-top: auto;
          transition: background 0.2s;
        }
        .ds-count-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--ac); flex-shrink: 0;
        }
        .ds-tile:hover .ds-count { background: #fff; }

        /* arrow hint */
        .ds-arrow {
          position: absolute; bottom: 18px; right: 16px;
          font-size: 14px; color: var(--ac);
          opacity: 0; transform: translateX(-6px);
          transition: all 0.22s cubic-bezier(0.22,1,0.36,1);
          font-family: "Outfit", sans-serif; font-weight: 800;
        }
        .ds-tile:hover .ds-arrow { opacity: 1; transform: translateX(0); }

        /* bottom cta strip */
        .ds-cta-strip {
          margin-top: 44px; display: flex; align-items: center;
          justify-content: center; gap: 14px;
          position: relative; z-index: 1;
        }
        .ds-cta-text {
          font-size: 13px; color: #6a8a76;
          font-family: "Outfit", sans-serif; font-weight: 500;
        }
        .ds-cta-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 12px 28px; border-radius: 999px;
          background: linear-gradient(135deg, #1a3d2e, #2a5c42);
          border: none; color: #fff;
          font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: "Outfit", sans-serif;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 4px 18px rgba(26,61,46,0.3);
        }
        .ds-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(26,61,46,0.4);
        }

        @media (max-width: 900px) {
          .ds-section { padding: 52px 20px 60px; }
          .ds-header { flex-direction: column; align-items: flex-start; gap: 20px; margin-bottom: 32px; }
          .ds-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        }
        @media (max-width: 480px) {
          .ds-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <section className="ds-section" ref={sectionRef}>
        <div className="ds-section-blob" />

        {/* ── HEADER ── */}
        <div className={`ds-header ${inView ? "ds-in" : ""}`}>
          <div className="ds-header-left">
            <div className="ds-tag">
              <span className="ds-tag-dot" />
              Medical Specialities
            </div>
            <h2 className="ds-title">
              Our <em>Departments</em>
            </h2>
            <p className="ds-subtitle">
              Expert care across 9 specialities — find the right department and book your visit instantly.
            </p>
          </div>
          <button className="ds-view-all" onClick={() => navigate("/departments")}>
            All Departments <span className="ds-view-all-arrow">→</span>
          </button>
        </div>

        {/* ── ICON GRID ── */}
        <div className="ds-grid">
          {departments.map((dept, i) => (
            <div
              key={dept.name}
              className={`ds-tile ${inView ? "ds-tile-in" : ""}`}
              style={{
                "--ac": dept.accent,
                "--lc": dept.bg,
                "--bc": `${dept.accent}30`,
                animationDelay: inView ? `${i * 55}ms` : "0ms",
              }}
              onClick={() => navigate("/departments")}
              onMouseEnter={() => setHovered(dept.name)}
              onMouseLeave={() => setHovered(null)}
              role="button"
              tabIndex={0}
              aria-label={`${dept.name} department`}
              onKeyDown={e => { if (e.key === "Enter") navigate("/departments"); }}
            >
              <div className="ds-tile-accent" />
              <div className="ds-icon">{dept.emoji}</div>
              <div className="ds-name">{dept.name}</div>
              <div className="ds-desc">{dept.desc}</div>
              <div className="ds-count">
                <span className="ds-count-dot" />
                {dept.count}
              </div>
              <span className="ds-arrow">→</span>
            </div>
          ))}
        </div>

        {/* ── BOTTOM CTA ── */}
        <div className="ds-cta-strip">
          <span className="ds-cta-text">Looking for a specific department?</span>
          <button className="ds-cta-btn" onClick={() => navigate("/departments")}>
            Explore All Departments →
          </button>
        </div>
      </section>
    </>
  );
};

export default Departments;
