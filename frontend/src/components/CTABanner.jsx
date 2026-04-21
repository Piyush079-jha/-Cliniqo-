import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CTABanner = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes ctaFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ctaFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes ctaShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ctaOrb {
          0%,100% { transform: scale(1); opacity: 0.05; }
          50%      { transform: scale(1.15); opacity: 0.09; }
        }

        .cta-section {
          padding: 96px 80px 80px;
          background: var(--bg-alt);
        }

        .cta-banner-wrap {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          padding-top: 26px;
        }

        .cta-banner {
          background: #1a3d2e;
          border-radius: 28px;
          padding: 64px 72px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 48px;
          position: relative; overflow: hidden;
          opacity: 0;
          box-shadow: 0 20px 56px rgba(26,61,46,0.28);
        }
        .cta-banner.visible {
          animation: ctaFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        .cta-banner::after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
          z-index: 0;
        }

        .cta-banner::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, #c9a84c, #e8cc80, #c9a84c, transparent);
          opacity: 0.85;
          z-index: 2;
        }

        .cta-orb {
          position: absolute; border-radius: 50%;
          background: rgba(255,255,255,1);
          pointer-events: none;
          animation: ctaOrb 6s ease-in-out infinite;
        }
        .cta-orb-1 { width: 300px; height: 300px; top: -110px; right: -70px; }
        .cta-orb-2 { width: 190px; height: 190px; bottom: -70px; left: 28%; animation-delay: 2s; }
        .cta-orb-3 { width: 110px; height: 110px; top: 20px; left: 40%; animation-delay: 4s; }

        .cta-left { flex: 1; position: relative; z-index: 1; }

        .cta-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.18);
          color: white; padding: 5px 14px; border-radius: 999px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; margin-bottom: 18px;
        }
        .cta-tag-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #c9a84c; flex-shrink: 0;
        }

        .cta-left h2 {
          color: white; font-size: clamp(24px, 3vw, 36px);
          margin-bottom: 14px; line-height: 1.2;
        }
        .cta-left p {
          color: #a8c4b4; font-size: 15.5px;
          line-height: 1.75; max-width: 480px; margin: 0;
        }

        .cta-right {
          display: flex; flex-direction: column; gap: 14px;
          flex-shrink: 0; position: relative; z-index: 1;
        }

        .cta-btn-primary {
          padding: 15px 36px; background: white;
          color: #1a3d2e !important;
          border: none; border-radius: 999px;
          font-size: 15px; font-weight: 800;
          cursor: pointer; font-family: "Outfit", sans-serif;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          position: relative; overflow: hidden;
        }
        .cta-btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.1) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: ctaShimmer 2.5s ease-in-out infinite;
        }
        .cta-btn-primary:hover {
          background: #c9a84c;
          color: white !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 32px rgba(201,168,76,0.35);
        }

        .cta-btn-secondary {
          padding: 14px 36px; background: transparent;
          color: white; border: 2px solid rgba(255,255,255,0.25);
          border-radius: 999px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: "Outfit", sans-serif;
          transition: all 0.22s; white-space: nowrap; text-align: center;
        }
        .cta-btn-secondary:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.55);
          transform: translateY(-1px);
        }

        .cta-float-badge {
          position: absolute;
          top: 0px;
          right: 72px;
          background: #c9a84c;
          color: #1a2e00;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 12px; font-weight: 800;
          box-shadow: 0 4px 16px rgba(201,168,76,0.45);
          animation: ctaFloat 3s ease-in-out infinite;
          white-space: nowrap; z-index: 3;
        }

        @media (max-width: 900px) {
          .cta-section { padding: 60px 24px 48px; }
          .cta-banner { flex-direction: column; padding: 44px 32px; text-align: center; }
          .cta-left p { max-width: 100%; }
          .cta-right { width: 100%; }
          .cta-btn-primary, .cta-btn-secondary { width: 100%; }
          .cta-float-badge { display: none; }
        }
      `}</style>

      <section className="cta-section" ref={ref}>
        <div className="cta-banner-wrap">

          <div className="cta-float-badge">🎉 Free First Consultation</div>

          <div className={`cta-banner ${visible ? "visible" : ""}`}>
            <div className="cta-orb cta-orb-1" />
            <div className="cta-orb cta-orb-2" />
            <div className="cta-orb cta-orb-3" />

            <div className="cta-left">
              <div className="cta-tag">
                <span className="cta-tag-dot" />
                Get Started Today
              </div>
              <h2>Ready to Take Control<br />of Your Health?</h2>
              <p>
                Join over 1,50,000 patients who trust Cliniqo for seamless,
                affordable, and expert healthcare — available across India.
              </p>
            </div>

            <div className="cta-right">
              <button className="cta-btn-primary" onClick={() => navigate("/appointment")}>
                Book Appointment Now →
              </button>
              {/* now navigates to /doctors */}
              <button className="cta-btn-secondary" onClick={() => navigate("/doctors")}>
                Explore Doctors
              </button>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default CTABanner;