import React, { useEffect, useRef, useState } from "react";

// dummy reviews 
const CARDS = [
  { name: "Priya Sharma",    location: "Mumbai, Maharashtra",   rating: 5, text: "Cliniqo made it incredibly easy to book an appointment. The doctor was excellent and the whole process was seamless!", initials: "PS", color: "#f43f5e", dept: "Cardiology" },
  { name: "Rahul Mehta",     location: "Bengaluru, Karnataka",  rating: 5, text: "Found a top neurologist within minutes. The follow-up reminders are a great touch. Highly recommend Cliniqo.", initials: "RM", color: "#a855f7", dept: "Neurology" },
  { name: "Anita Patel",     location: "Ahmedabad, Gujarat",    rating: 5, text: "Best healthcare platform in India. Got my child's pediatric appointment confirmed in under 5 minutes.", initials: "AP", color: "#10b981", dept: "Pediatrics" },
  { name: "Suresh Kumar",    location: "Chennai, Tamil Nadu",   rating: 5, text: "Exceptional service! The doctors are highly qualified and the booking process is super smooth.", initials: "SK", color: "#f59e0b", dept: "Orthopedics" },
  { name: "Meera Nair",      location: "Kochi, Kerala",         rating: 5, text: "I was able to consult a specialist within hours. Cliniqo has truly transformed healthcare accessibility.", initials: "MN", color: "#0ea5e9", dept: "Dermatology" },
  { name: "Arjun Singh",     location: "Delhi, NCR",            rating: 5, text: "The platform is very user-friendly. I booked my appointment in under 2 minutes. Absolutely love it!", initials: "AS", color: "#22c55e", dept: "ENT" },
];

//  MAIN COMPONENT 
const Testimonials = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible]     = useState(false);

  const ref      = useRef(null);
  const trackRef = useRef(null);
  const autoRef  = useRef(null);

  //  intersection observer for fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // ── auto-slide
  useEffect(() => {
    autoRef.current = setInterval(
      () => setActiveIdx((p) => (p + 1) % CARDS.length),
      3800
    );
    return () => clearInterval(autoRef.current);
  }, []);

  // ── scroll active card into view
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[activeIdx];
    if (!card) return;
    const offset =
      card.getBoundingClientRect().left -
      track.getBoundingClientRect().left -
      track.clientWidth / 2 +
      card.clientWidth / 2;
    track.scrollBy({ left: offset, behavior: "smooth" });
  }, [activeIdx]);

  // ── dot click — reset timer
  const handleDotClick = (i) => {
    clearInterval(autoRef.current);
    setActiveIdx(i);
    autoRef.current = setInterval(
      () => setActiveIdx((p) => (p + 1) % CARDS.length),
      3800
    );
  };

  //  RENDER 
  return (
    <>
      <style>{`
        @keyframes testFadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .test-section { padding:96px 0; background:var(--bg-section); }

        .test-header {
          text-align:center; max-width:560px;
          margin:0 auto 52px; padding:0 24px;
        }
        .test-header.visible { animation:testFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .test-header h2 { margin-bottom:12px; }
        .test-header p  { color:var(--text-gray); font-size:15.5px; line-height:1.8; }

        /* ── cards track ── */
        .test-track {
          display:flex; gap:20px;
          padding:12px 80px 20px;
          overflow-x:auto;
          scrollbar-width:none; -ms-overflow-style:none;
          cursor:grab;
        }
        .test-track::-webkit-scrollbar { display:none; }
        .test-track:active { cursor:grabbing; }

        .test-card {
          flex:0 0 320px; background:var(--bg-card);
          border:1px solid var(--border); border-radius:20px;
          padding:28px 24px; transition:all 0.35s cubic-bezier(0.22,1,0.36,1);
          position:relative; overflow:hidden;
        }
        .test-card.active { border-color:var(--primary-light); box-shadow:var(--shadow-md); transform:translateY(-4px); }
        .test-card:hover  { transform:translateY(-6px); box-shadow:var(--shadow-md); border-color:var(--primary-light); }

        .test-quote-mark {
          position:absolute; top:12px; right:18px;
          font-size:64px; line-height:1; font-family:Georgia,serif;
          color:var(--border); pointer-events:none; transition:color 0.25s;
        }
        .test-card.active .test-quote-mark,
        .test-card:hover  .test-quote-mark { color:var(--primary-light); }

        .test-dept-tag { display:inline-flex; align-items:center; padding:4px 11px; border-radius:999px; font-size:11px; font-weight:700; margin-bottom:12px; letter-spacing:0.3px; }
        .test-stars    { display:flex; gap:2px; margin-bottom:14px; }
        .test-star     { color:#f59e0b; font-size:14px; }
        .test-text     { font-size:14px; line-height:1.8; color:var(--text-gray); margin-bottom:22px; position:relative; z-index:1; }
        .test-author   { display:flex; align-items:center; gap:12px; padding-top:18px; border-top:1px solid var(--border); }
        .test-avatar   { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#fff; flex-shrink:0; }
        .test-author-name { font-size:13px; font-weight:700; color:var(--text-dark); margin-bottom:2px; font-family:"Outfit",sans-serif; }
        .test-author-loc  { font-size:11px; color:var(--text-gray); }

        .test-dots { display:flex; justify-content:center; gap:8px; margin-top:32px; padding:0 24px; }
        .test-dot { height:8px; border-radius:4px; border:none; cursor:pointer; background:var(--border); transition:all 0.3s; padding:0; }
        .test-dot.active          { background:var(--primary); width:24px; }
        .test-dot:not(.active)    { width:8px; }
        .test-dot:hover:not(.active) { background:var(--primary-light); }

        .test-trust-bar {
          display:flex; justify-content:center; align-items:center;
          gap:48px; margin:52px 80px 0; padding-top:44px;
          border-top:1px solid var(--border);
        }
        .test-trust-bar.visible { animation:testFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s both; }
        .test-trust-num   { font-size:28px; font-weight:800; color:var(--primary); font-family:"Outfit",sans-serif; line-height:1; margin-bottom:5px; }
        .test-trust-label { font-size:11px; font-weight:600; color:var(--text-gray); text-transform:uppercase; letter-spacing:0.5px; }
        .test-trust-div   { width:1px; height:36px; background:var(--border); }

        @media(max-width:900px){
          .test-section  { padding:60px 0; }
          .test-track    { padding:12px 24px 20px; }
          .test-card     { flex:0 0 280px; }
          .test-trust-bar{ gap:24px; flex-wrap:wrap; margin:40px 24px 0; }
          .test-trust-div{ display:none; }
        }
      `}</style>

      <section className="test-section" ref={ref}>

        {/* ── HEADER ── */}
        <div className={`test-header ${visible ? "visible" : ""}`}>
          <span className="section-tag">Testimonials</span>
          <h2>What Our Patients Say</h2>
          <p>Thousands of patients across India trust Cliniqo for their healthcare needs.</p>
        </div>

        {/* ── CARDS TRACK ── */}
        <div className="test-track" ref={trackRef}>
          {CARDS.map((t, i) => (
            <div
              key={i}
              className={`test-card ${i === activeIdx ? "active" : ""}`}
              onClick={() => handleDotClick(i)}
            >
              <div className="test-quote-mark">"</div>
              <div
                className="test-dept-tag"
                style={{ background:`${t.color}18`, color:t.color, border:`1px solid ${t.color}30` }}
              >
                {t.dept}
              </div>
              <div className="test-stars">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <span key={si} className="test-star">★</span>
                ))}
              </div>
              <p className="test-text">"{t.text}"</p>
              <div className="test-author">
                <div className="test-avatar" style={{ background: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <div className="test-author-name">{t.name}</div>
                  {t.location && (
                    <div className="test-author-loc">📍 {t.location}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── DOTS ── */}
        <div className="test-dots">
          {CARDS.map((_, i) => (
            <button
              key={i}
              className={`test-dot ${i === activeIdx ? "active" : ""}`}
              onClick={() => handleDotClick(i)}
            />
          ))}
        </div>

        {/* ── TRUST BAR ── */}
        <div className={`test-trust-bar ${visible ? "visible" : ""}`}>
          {[
            { num: "4.9★",    label: "Average Rating" },
            { num: "50,000+", label: "Reviews" },
            { num: "98%",     label: "Would Recommend" },
            { num: "24/7",    label: "Support Available" },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="test-trust-div" />}
              <div style={{ textAlign:"center" }}>
                <div className="test-trust-num">{item.num}</div>
                <div className="test-trust-label">{item.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

      </section>
    </>
  );
};

export default Testimonials;