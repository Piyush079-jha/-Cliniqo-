
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Hero = ({ title, description }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState({ patients: 0, sections: 0, doctors: 0 });
  const statsRef = useRef(null);
  const counted  = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          animateCount("patients", 150000, 1800);
          animateCount("sections", 25, 1200);
          animateCount("doctors",  500,  1500);
        }
      },
      { threshold: 0.5 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const animateCount = (key, target, duration) => {
    const start = performance.now();
    const tick  = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setCount(prev => ({ ...prev, [key]: Math.floor(ease * target) }));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <>
      <style>{`
        @keyframes fadeLeft  { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeRight { from{opacity:0;transform:translateX(32px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes imgReveal { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
        @keyframes floatA    { 0%,100%{transform:translateY(0px) translateX(-50%)}  50%{transform:translateY(-8px) translateX(-50%)} }
        @keyframes floatB    { 0%,100%{transform:translateY(-50%)}                  50%{transform:translateY(calc(-50% - 10px))} }
        @keyframes floatC    { 0%,100%{transform:translateY(0px) translateX(-50%)}  50%{transform:translateY(-7px) translateX(-50%)} }
        @keyframes greenPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.45)} 60%{box-shadow:0 0 0 7px rgba(34,197,94,0)} }
        @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }

        .hero-wrap { overflow: visible; }

        .h-content  { opacity:0; animation:fadeLeft  .9s cubic-bezier(.22,1,.36,1) .1s  forwards; }
        .h-image-side { opacity:0; animation:fadeRight .9s cubic-bezier(.22,1,.36,1) .25s forwards; }

        .h-badge-dot { width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:greenPulse 2.2s ease-in-out infinite; }

        .h-cta-primary {
          display:inline-flex;align-items:center;gap:10px;
          padding:14px 30px;border-radius:999px;
          background:linear-gradient(135deg,var(--primary),var(--primary-dark));
          color:white;border:none;font-size:15px;font-weight:700;
          cursor:pointer;font-family:"Outfit",sans-serif;
          transition:all .25s cubic-bezier(.22,1,.36,1);
          box-shadow:var(--shadow-green);
          position:relative;overflow:hidden;width:100%;justify-content:center;
        }
        .h-cta-primary::after {
          content:'';position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.15) 50%,transparent 60%);
          background-size:200% 100%;animation:shimmer 2.5s ease-in-out infinite;
        }
        .h-cta-primary:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(45,106,82,.38); }

        .h-cta-outline {
          display:inline-flex;align-items:center;justify-content:center;gap:10px;
          padding:13px 28px;border-radius:999px;width:100%;
          background:var(--bg-card);color:var(--primary-dark);
          border:1.5px solid var(--border);font-size:15px;font-weight:600;
          cursor:pointer;font-family:"Outfit",sans-serif;transition:all .22s;
        }
        .h-cta-outline:hover { border-color:var(--primary);background:var(--primary-bg);transform:translateY(-1px); }

        .h-stats-box { display:flex;gap:0;border:1px solid var(--border);border-radius:16px;background:var(--bg-card);overflow:hidden;box-shadow:var(--shadow-sm);width:fit-content; }
        .h-stat { padding:18px 26px;text-align:center;border-right:1px solid var(--border);transition:background .2s; }
        .h-stat:last-child { border-right:none; }
        .h-stat:hover { background:var(--primary-bg); }
        .h-stat-num { font-size:22px;font-weight:800;color:var(--primary);font-family:"Outfit",sans-serif;line-height:1;margin-bottom:5px; }
        .h-stat-label { font-size:11px;color:var(--text-gray);font-weight:600;text-transform:uppercase;letter-spacing:.6px; }

        .h-img-container { position:relative;width:440px;height:480px;flex-shrink:0; }
        .h-img-inner { position:absolute;inset:0;border-radius:28px;overflow:hidden;animation:imgReveal 1.1s cubic-bezier(.22,1,.36,1) .3s both;box-shadow:var(--shadow-lg); }
        .h-img-inner img { width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block; }
        .h-img-placeholder { width:100%;height:100%;background:linear-gradient(160deg,var(--primary-light),var(--primary-bg) 60%,#e8f5ee);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px; }
        .h-img-placeholder .med-icon { font-size:80px;opacity:.7; }
        .h-img-placeholder .med-text { font-family:"Cormorant Garamond",serif;font-size:20px;font-weight:700;color:var(--primary);opacity:.8; }

        .h-fade { position:absolute;inset:0;pointer-events:none;z-index:2;border-radius:28px; }

        .h-card { position:absolute;z-index:10;background:rgba(255,255,255,.97);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-md);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px); }
        .h-card-top    { top:-18px;left:50%;transform:translateX(-50%);padding:9px 22px;border-radius:999px;display:flex;align-items:center;gap:9px;white-space:nowrap;animation:floatA 4s ease-in-out infinite; }
        .h-card-left   { left:-28px;top:44%;padding:16px 20px;min-width:148px;animation:floatB 4.5s ease-in-out .5s infinite;transform:translateY(-50%); }
        .h-card-right  { right:-28px;top:28%;padding:16px 20px;min-width:130px;animation:floatB 4s ease-in-out 1.2s infinite;transform:translateY(-50%); }
        .h-card-bottom { bottom:-20px;left:50%;transform:translateX(-50%);padding:12px 20px;display:flex;align-items:center;gap:13px;white-space:nowrap;animation:floatC 4.2s ease-in-out .8s infinite; }
        .h-card-micro  { font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px; }
        .h-card-num    { font-size:22px;font-weight:800;color:var(--primary);line-height:1;font-family:"Outfit",sans-serif; }
        .h-card-sub    { font-size:11px;color:var(--text-gray);margin-top:3px; }
        .h-card-label  { font-size:13px;font-weight:700;color:var(--primary); }

        .h-avatar-stack { display:flex; }
        .h-avatar { width:32px;height:32px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:800;margin-left:-9px;position:relative; }
        .h-avatar:first-child { margin-left:0; }

        .h-blob { position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(45,106,82,.07) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0; }
        .h-dots { position:absolute;bottom:40px;left:-50px;width:100px;height:100px;z-index:0;background-image:radial-gradient(circle,var(--primary-light) 1.5px,transparent 1.5px);background-size:14px 14px;opacity:.6; }

        @media(max-width:1200px){ .h-img-container{width:380px;height:430px} }
        @media(max-width:1000px){ .h-img-container{width:320px;height:380px} .h-card-left,.h-card-right{display:none} }
        @media(max-width:768px)  { .h-img-container{width:280px;height:320px} .h-card-top,.h-card-bottom{display:none} }
      `}</style>

      <section className="hero hero-wrap">
        <div className="hero-inner" style={{ alignItems:"center", paddingTop:"40px", paddingBottom:"60px", minHeight:"auto" }}>

          {/* LEFT CONTENT */}
          <div className="hero-content h-content" style={{ flex:1, maxWidth:"520px" }}>
            <div className="hero-badge" style={{ marginBottom:"24px" }}>
              <span className="h-badge-dot" />
              Trusted Healthcare — Since 2024
            </div>

            <h1
              dangerouslySetInnerHTML={{ __html: title || "Your Health,<br/><em>Our Priority</em>" }}
              style={{ marginBottom:"18px", letterSpacing:"-1.5px" }}
            />

            <p className="hero-desc" style={{ marginBottom:"32px", fontSize:"16px", lineHeight:"1.85" }}>
              {description || "Cliniqo connects you with India's best doctors. Book appointments, get specialist consultations, and manage your health journey — all from one trusted platform."}
            </p>

            <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"44px", maxWidth:"320px" }}>
              <button className="h-cta-primary" onClick={() => navigate("/appointment")}>
                Make an Appointment →
              </button>


              <button className="h-cta-outline" onClick={() => navigate("/doctors")}>
                Find a Doctor →
              </button>
            </div>

            <div className="h-stats-box" ref={statsRef}>
              <div className="h-stat">
                <div className="h-stat-num">
                  {count.patients >= 1000
                    ? `${Math.floor(count.patients / 1000)},${String(count.patients % 1000).padStart(3,"0")}+`
                    : `${count.patients}+`}
                </div>
                <div className="h-stat-label">Satisfied Patients</div>
              </div>
              <div className="h-stat">
                <div className="h-stat-num">{count.sections}+</div>
                <div className="h-stat-label">Health Sections</div>
              </div>
              <div className="h-stat">
                <div className="h-stat-num">{count.doctors}+</div>
                <div className="h-stat-label">Doctors</div>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="hero-image h-image-side" style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center", position:"relative", overflow:"visible" }}>
            <div className="h-blob" />
            <div className="h-dots" />
            <div className="h-img-container">
              <div className="h-img-inner">
                <img
                  src="/Cliniqo.jpg"
                  alt="Cliniqo doctor team"
                  onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                />
                <div className="h-img-placeholder" style={{ display:"none" }}>
                  <div className="med-icon">🩺</div>
                  <div className="med-text">Expert Healthcare</div>
                  <div style={{ display:"flex", gap:12, marginTop:8 }}>
                    {["👨‍⚕️","👩‍⚕️","🏥"].map((e,i) => <span key={i} style={{ fontSize:32 }}>{e}</span>)}
                  </div>
                </div>
                <div className="h-fade" style={{ background:"linear-gradient(90deg,var(--bg-main) 0%,rgba(240,250,245,.6) 15%,transparent 40%)" }} />
                <div className="h-fade" style={{ background:"linear-gradient(270deg,var(--bg-main) 0%,rgba(240,250,245,.6) 15%,transparent 40%)" }} />
                <div className="h-fade" style={{ background:"linear-gradient(0deg,var(--bg-main) 0%,rgba(240,250,245,.8) 20%,transparent 50%)" }} />
                <div className="h-fade" style={{ background:"linear-gradient(180deg,var(--bg-main) 0%,rgba(240,250,245,.3) 10%,transparent 28%)" }} />
              </div>
              <div className="h-card h-card-top">
                <span className="h-badge-dot" />
                <span style={{ fontSize:"12.5px", fontWeight:700, color:"var(--primary)" }}>500+ Verified Specialists</span>
              </div>
              <div className="h-card h-card-left">
                <div className="h-card-micro">Patients Served</div>
                <div className="h-card-num">1,50,000+</div>
                <div className="h-card-sub">Satisfied &amp; counting</div>
              </div>
              <div className="h-card h-card-right">
                <div className="h-card-micro">Specialities</div>
                <div className="h-card-num">25+</div>
                <div className="h-card-sub">Health sections</div>
              </div>
              <div className="h-card h-card-bottom">
                <div className="h-avatar-stack">
                  {[{bg:"#3b82f6",l:"D"},{bg:"#10b981",l:"M"},{bg:"#f59e0b",l:"S"},{bg:"#8b5cf6",l:"R"}].map((av,i)=>(
                    <div key={i} className="h-avatar" style={{ background:av.bg, zIndex:10-i }}>{av.l}</div>
                  ))}
                </div>
                <div>
                  <div className="h-card-label">Our Expert Team</div>
                  <div className="h-card-sub" style={{ marginTop:2 }}>25+ specialities covered</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default Hero;