import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Biography = ({ imageUrl, reverse }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  const points = [
    { icon: "👨‍⚕️", text: "Team of 500+ certified specialist doctors" },
    { icon: "📅", text: "Available 7 days a week, pan-India coverage" },
    { icon: "⚡", text: "Seamless appointment booking & follow-ups" },
    { icon: "🔒", text: "Patient data secured with industry-grade encryption" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes bioFadeLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bioFadeRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bioFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bioImgReveal {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pointIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .bio-section-wrap {
          background: var(--bg-section);
          padding: 96px 80px;
          transition: background 0.3s;
          position: relative;
          overflow: hidden;
        }
        .bio-section-wrap::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,176,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .bio-inner {
          display: flex;
          gap: 80px;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Image side */
        .bio-img-side {
          flex: 1;
          position: relative;
          opacity: 0;
        }
        .bio-img-side.visible {
          animation: bioFadeLeft 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .bio-img-frame {
          border-radius: 24px;
          overflow: hidden;
          height: 500px;
          position: relative;
          box-shadow: 0 20px 60px rgba(27,79,138,0.14);
        }
        .bio-img-frame img {
          width: 100%; height: 100%;
          object-fit: contain;
          object-position: center;
          display: block;
          background: linear-gradient(160deg, #eff6ff, #dbeafe);
          animation: bioImgReveal 1s ease both;
        }

        /* Decorative accent card on image */
        .bio-accent-card {
          position: absolute;
          bottom: -20px; right: -20px;
          background: var(--primary);
          color: white;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 12px 40px rgba(27,79,138,0.3);
          text-align: center;
          min-width: 120px;
        }
        .bio-accent-num {
          font-size: 32px; font-weight: 800;
          font-family: "DM Sans", sans-serif;
          line-height: 1;
          margin-bottom: 4px;
        }
        .bio-accent-label {
          font-size: 11px; font-weight: 600;
          opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px;
        }

        /* Dots decoration */
        .bio-dots {
          position: absolute;
          top: -30px; left: -30px;
          width: 100px; height: 100px;
          background-image: radial-gradient(circle, var(--primary-light) 1.5px, transparent 1.5px);
          background-size: 13px 13px;
          opacity: 0.6;
          pointer-events: none;
        }

        /* Content side */
        .bio-content-side {
          flex: 1;
          opacity: 0;
        }
        .bio-content-side.visible {
          animation: bioFadeRight 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s forwards;
        }

        .bio-content-side h2 {
          margin-bottom: 18px;
          line-height: 1.2;
        }
        .bio-content-side > p {
          margin-bottom: 16px;
          font-size: 15.5px;
          line-height: 1.85;
          color: var(--text-gray);
        }

        .bio-points-list {
          margin: 28px 0 32px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .bio-point-item {
          display: flex;
          align-items: center;
          gap: 14px;
          opacity: 0;
          padding: 14px 18px;
          border-radius: 12px;
          background: var(--bg-alt);
          border: 1px solid var(--border);
          transition: all 0.22s;
        }
        .bio-point-item:hover {
          border-color: var(--primary-light);
          background: var(--primary-bg);
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(27,79,138,0.08);
        }
        .bio-point-item.visible {
          animation: pointIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .bio-point-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: var(--primary-bg);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .bio-point-text {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-mid);
          line-height: 1.4;
        }

        .bio-cta-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 8px;
        }
        .bio-cta-btn {
          padding: 13px 28px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 999px;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          font-family: "DM Sans", sans-serif;
          transition: all 0.22s;
          box-shadow: 0 4px 20px rgba(27,79,138,0.22);
        }
        .bio-cta-btn:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(27,79,138,0.3);
        }
        .bio-cta-link {
          font-size: 14px; font-weight: 600;
          color: var(--primary);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .bio-cta-link:hover { opacity: 1; }

        @media (max-width: 900px) {
          .bio-section-wrap { padding: 60px 24px; }
          .bio-inner { flex-direction: column !important; gap: 48px; }
          .bio-img-frame { height: 360px; }
          .bio-accent-card { bottom: 16px; right: 16px; }
        }
      `}</style>

      <section className="bio-section-wrap" ref={ref}>
        <div
          className="bio-inner"
          style={{ flexDirection: reverse ? "row-reverse" : "row" }}
        >

          {/* ── IMAGE SIDE ── */}
          <div className={`bio-img-side ${visible ? "visible" : ""}`}>
            <div className="bio-dots" />
            <div className="bio-img-frame">
              <img
                src={imageUrl || "/healthcare.png"}
                alt="Cliniqo Healthcare"
              />
            </div>

            {/* Accent stat card */}
            <div className="bio-accent-card">
              <div className="bio-accent-num">98%</div>
              <div className="bio-accent-label">Patient Satisfaction</div>
            </div>
          </div>

          {/* ── CONTENT SIDE ── */}
          <div className={`bio-content-side ${visible ? "visible" : ""}`}>
            <span className="section-tag">Our Story</span>
            <h2>Transforming Healthcare,<br />One Patient at a Time</h2>

            <p>
              Cliniqo was born from a simple belief — quality healthcare should
              be accessible to every Indian. We bridge the gap between patients
              and trusted medical professionals across the country.
            </p>

            <ul className="bio-points-list">
              {points.map((point, i) => (
                <li
                  key={i}
                  className={`bio-point-item ${visible ? "visible" : ""}`}
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
                  <div className="bio-point-icon">{point.icon}</div>
                  <span className="bio-point-text">{point.text}</span>
                </li>
              ))}
            </ul>

            <p>
              From general consultations to specialized care, Cliniqo is your
              lifelong healthcare companion.
            </p>

            <div className="bio-cta-row" style={{ marginTop: "28px" }}>
              {/*  "Learn Our Story" → navigates to /about */}
              <button className="bio-cta-btn" onClick={() => navigate("/about")}>
                Learn Our Story →
              </button>
              {/*  "Meet the Team" → navigates to /doctors */}
              <span className="bio-cta-link" onClick={() => navigate("/doctors")}>
                Meet the Team
              </span>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default Biography;