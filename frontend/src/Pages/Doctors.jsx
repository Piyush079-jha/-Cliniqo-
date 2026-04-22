import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";

const departments = [
  "All", "Cardiology", "Neurology", "Oncology", "Radiology",
  "Pediatrics", "Orthopedics", "Physical Therapy", "Dermatology", "ENT",
];

const deptMeta = {
  Cardiology:         { accent: "#f43f5e", bg: "#fff1f2", light: "#ffe4e6", emoji: "❤️" },
  Neurology:          { accent: "#a855f7", bg: "#faf5ff", light: "#f3e8ff", emoji: "🧠" },
  Oncology:           { accent: "#3b82f6", bg: "#eff6ff", light: "#dbeafe", emoji: "🎗️" },
  Radiology:          { accent: "#14b8a6", bg: "#f0fdfa", light: "#ccfbf1", emoji: "🔬" },
  Pediatrics:         { accent: "#f59e0b", bg: "#fffbeb", light: "#fef3c7", emoji: "👶" },
  Orthopedics:        { accent: "#22c55e", bg: "#f0fdf4", light: "#dcfce7", emoji: "🦴" },
  "Physical Therapy": { accent: "#f97316", bg: "#fff7ed", light: "#ffedd5", emoji: "🏃" },
  Dermatology:        { accent: "#c026d3", bg: "#fdf4ff", light: "#fae8ff", emoji: "✨" },
  ENT:                { accent: "#06b6d4", bg: "#ecfeff", light: "#cffafe", emoji: "👂" },
};

// const CITIES = ["All Cities", "Bhubaneswar", "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur"];
const POPULAR_SEARCHES = [
  { label: "Cardiologist", emoji: "🫀" },
  { label: "Dermatologist", emoji: "✨" },
  { label: "Neurologist",  emoji: "🧠" },
  { label: "Dentist",      emoji: "🦷" },
  { label: "Pediatrician", emoji: "👶" },
  { label: "Orthopedic",   emoji: "🦴" },
];

const getDoctorAvatar = (doctor) => {
  const name = `${doctor.firstName}+${doctor.lastName}`;
  const bg   = doctor.gender === "Female" ? "be185d" : "1a3d2e";
  return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=128&bold=true`;
};

const StarDisplay = ({ rating, size = 14 }) => (
  <span style={{ display: "inline-flex", gap: "1px" }}>
    {[1,2,3,4,5].map(s => (
      <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db", lineHeight: 1 }}>★</span>
    ))}
  </span>
);

const StarInput = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: "4px" }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onChange(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          style={{ fontSize: 26, color: s <= (hovered || value) ? "#f59e0b" : "#d1d5db", cursor: "pointer", transition: "color .15s, transform .15s", display: "inline-block", transform: s <= (hovered || value) ? "scale(1.15)" : "scale(1)" }}>★</span>
      ))}
    </span>
  );
};

// const getAvailableDates = () => {
//   const dates = [];
//   const today = new Date();
//   for (let i = 0; i < 7; i++) {
//     const d = new Date(today);
//     d.setDate(today.getDate() + i);
//     dates.push(d);
//   }
//   return dates;
// };

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Generates time slots between startHour and endHour every intervalMins
const generateSlots = (startHour = 9, endHour = 17, intervalMins = 30) => {
  const slots = [];
  let current = startHour * 60;
  const end   = endHour  * 60;
  while (current < end) {
    const h   = Math.floor(current / 60);
    const m   = current % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push(`${h12}:${m.toString().padStart(2, "0")} ${ampm}`);
    current += intervalMins;
  }
  return slots;
  
};
const TIME_SLOTS = generateSlots(9, 17, 30);

// ── Returns next N dates, skipping days the doctor doesn't work
const getAvailableDates = (workingDays = ["Mon","Tue","Wed","Thu","Fri","Sat"], count = 10) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  let attempts = 0;
  while (dates.length < count && attempts < 60) {
    const dayShort = DAY_SHORT[cursor.getDay()];
    if (workingDays.includes(dayShort)) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    attempts++;
  }
  return dates;
};

// ─── SEARCH BAR COMPONENT ────────────────────────────────────────────────────
const DoctorSearchBar = ({ doctors, onSearch }) => {
  const [query,       setQuery]       = useState("");
  // const [city,        setCity]        = useState("");
  const [dept,        setDept]        = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug,     setShowSug]     = useState(false);
  // const [cityOpen,    setCityOpen]    = useState(false);
  const [deptOpen,    setDeptOpen]    = useState(false);
  const [focused,     setFocused]     = useState(false);
  const [activeTags,  setActiveTags]  = useState([]);
  const [mounted,     setMounted]     = useState(false);

  const inputRef  = useRef(null);
  // const cityRef   = useRef(null);
  const deptRef   = useRef(null);
  const wrapRef   = useRef(null);

  useEffect(() => { setTimeout(() => setMounted(true), 120); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      // if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false);
      if (deptRef.current && !deptRef.current.contains(e.target)) setDeptOpen(false);
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build suggestions from live doctors data
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    const hits = [];
    const seen = new Set();
    doctors.forEach(d => {
      const fullName = `Dr. ${d.firstName} ${d.lastName}`.toLowerCase();
      const deptName = (d.doctorDepartment || "").toLowerCase();
      if ((fullName.includes(q) || deptName.includes(q)) && !seen.has(fullName)) {
        seen.add(fullName);
        hits.push({ type: deptName.includes(q) ? "dept" : "doctor", label: `Dr. ${d.firstName} ${d.lastName}`, sub: d.doctorDepartment, emoji: deptMeta[d.doctorDepartment]?.emoji || "🏥" });
      }
    });
    // Also add dept-level suggestions
    departments.filter(d => d !== "All" && d.toLowerCase().includes(q) && !seen.has(d)).slice(0, 3).forEach(d => {
      hits.push({ type: "dept", label: d, sub: "Department", emoji: deptMeta[d]?.emoji || "🏥" });
    });
    setSuggestions(hits.slice(0, 6));
  }, [query, doctors]);

  // const doSearch = () => {
  //   onSearch({ query: query.trim(), dept });
  //   setShowSug(false);
  //   setCityOpen(false);
  //   setDeptOpen(false);
  // };
const doSearch = () => {
    onSearch({ query: query.trim(), dept });
    setShowSug(false);
    setDeptOpen(false);
  };
  const handleKeyDown = (e) => { if (e.key === "Enter") doSearch(); };

  const pickSuggestion = (sug) => {
    setQuery(sug.type === "doctor" ? sug.label : sug.label);
    setShowSug(false);
    onSearch({ query: sug.label, dept: sug.type === "dept" ? sug.label : dept });
  };

  const popularToDept = {
    "Cardiologist": "Cardiology",
    "Dermatologist": "Dermatology",
    "Neurologist": "Neurology",
    "Dentist": "",
    "Pediatrician": "Pediatrics",
    "Orthopedic": "Orthopedics",
  };

  const pickPopular = (tag) => {
    const mappedDept = popularToDept[tag] || "";
    setQuery(tag);
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    onSearch({ query: mappedDept || tag, dept: mappedDept || dept });
  };

  // const clearAll = () => {
  //   setQuery(""); setCity(""); setDept(""); setActiveTags([]);
  //   onSearch({ query: "", city: "", dept: "" });
  // };


  const clearAll = () => {
    setQuery(""); setDept(""); setActiveTags([]);
    onSearch({ query: "", dept: "" });
  };

  const hasFilters = query || dept;

  return (
    <div style={{ background: "linear-gradient(180deg,#1a3d2e 0%,#0f2318 100%)", padding: "0 80px 0", position: "relative", zIndex: 20 }}>
      {/* ── SEARCH CARD ── */}
      <div
        ref={wrapRef}
        style={{
          transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(.98)",
          opacity: mounted ? 1 : 0,
          transition: "transform .55s cubic-bezier(.22,1,.36,1), opacity .45s ease",
          position: "relative",
          zIndex: 21,
          paddingBottom: "28px",
        }}
      >
        {/* Glass card */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1.5px solid ${focused ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.15)"}`,
          borderRadius: "20px",
          padding: "6px 6px 6px 6px",
          boxShadow: focused
            ? "0 20px 60px rgba(0,0,0,0.45), 0 0 0 4px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.15)"
            : "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
          transition: "all .35s cubic-bezier(.22,1,.36,1)",
          display: "flex",
          alignItems: "stretch",
          gap: "0",
          flexWrap: "wrap",
        }}>

          {/* ── SEARCH INPUT ── */}
          <div style={{ flex: "2 1 220px", position: "relative", display: "flex", alignItems: "center" }}>
            {/* Search icon */}
            <span style={{ position: "absolute", left: "18px", color: focused ? "#c9a84c" : "rgba(255,255,255,0.45)", transition: "color .25s", pointerEvents: "none", display: "flex", zIndex: 2 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search doctors, specialties, departments…"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSug(true); }}
              onFocus={() => { setFocused(true); if (query.length >= 2) setShowSug(true); }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              aria-label="Search doctors or specialties"
              aria-autocomplete="list"
              aria-expanded={showSug}
              style={{
                width: "100%", height: "56px", paddingLeft: "50px", paddingRight: query ? "42px" : "16px",
                background: "transparent", border: "none", outline: "none",
                color: "#fff", fontSize: "15px", fontFamily: '"Outfit",sans-serif', fontWeight: 500,
                caretColor: "#c9a84c",
              }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setSuggestions([]); onSearch({ query: "", dept }); }}
                style={{ position: "absolute", right: "14px", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "background .2s" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSug && suggestions.length > 0 && (
              <div role="listbox" aria-label="Search suggestions" style={{
                position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0,
                background: "#0f2318", border: "1.5px solid rgba(201,168,76,0.3)",
                borderRadius: "14px", overflow: "hidden", zIndex: 50,
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                animation: "sugIn .2s cubic-bezier(.22,1,.36,1)",
              }}>
                <div style={{ padding: "8px 12px 6px", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.3)", fontFamily: '"Outfit",sans-serif', letterSpacing: "1.2px", textTransform: "uppercase" }}>Suggestions</div>
                {suggestions.map((sug, i) => (
                  <button key={i} role="option" onMouseDown={() => pickSuggestion(sug)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: "18px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.07)", borderRadius: "8px" }}>{sug.emoji}</span>
                    <div>
                      <div style={{ fontSize: "14px", color: "#fff", fontWeight: 600, fontFamily: '"Outfit",sans-serif' }}>{sug.label}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: '"Outfit",sans-serif' }}>{sug.sub}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "#c9a84c", fontWeight: 700, fontFamily: '"Outfit",sans-serif', background: "rgba(201,168,76,0.1)", padding: "2px 8px", borderRadius: "999px" }}>{sug.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          {/* <div style={{ width: "1px", background: "rgba(255,255,255,0.12)", margin: "10px 0", flexShrink: 0, alignSelf: "stretch" }} /> */}

          {/* ── CITY DROPDOWN ──
          <div ref={cityRef} style={{ flex: "1 1 160px", position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "16px", color: city ? "#c9a84c" : "rgba(255,255,255,0.4)", pointerEvents: "none", display: "flex", transition: "color .25s" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <button onClick={() => { setCityOpen(o => !o); setDeptOpen(false); }} aria-label="Select city" aria-expanded={cityOpen} aria-haspopup="listbox"
              style={{ width: "100%", height: "56px", paddingLeft: "42px", paddingRight: "32px", background: "transparent", border: "none", color: city ? "#fff" : "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: '"Outfit",sans-serif', fontWeight: city ? 600 : 400, cursor: "pointer", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {city || "Select City"}
            </button>
            <span style={{ position: "absolute", right: "12px", color: "rgba(255,255,255,0.35)", pointerEvents: "none", display: "flex", transform: cityOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            {cityOpen && (
              <div role="listbox" aria-label="City options" style={{ position: "absolute", top: "calc(100% + 10px)", left: "-10px", minWidth: "200px", background: "#0f2318", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "14px", overflow: "hidden", zIndex: 50, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", animation: "sugIn .2s cubic-bezier(.22,1,.36,1)" }}>
                {CITIES.map((c, i) => (
                  <button key={i} role="option" aria-selected={city === c} onMouseDown={() => { setCity(c === "All Cities" ? "" : c); setCityOpen(false); onSearch({ query, city: c === "All Cities" ? "" : c, dept }); }}
                    style={{ width: "100%", padding: "10px 16px", background: city === c || (c === "All Cities" && !city) ? "rgba(201,168,76,0.12)" : "transparent", border: "none", color: city === c || (c === "All Cities" && !city) ? "#c9a84c" : "rgba(255,255,255,0.75)", fontSize: "13px", fontFamily: '"Outfit",sans-serif', fontWeight: city === c ? 700 : 400, cursor: "pointer", textAlign: "left", transition: "background .15s, color .15s" }}
                    onMouseEnter={e => { if (!city || city !== c) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { if (!city || city !== c) e.currentTarget.style.background = "transparent"; }}>
                    {c === "All Cities" ? "🌍 " : "📍 "}{c}
                  </button>
                ))}
              </div>
            )}
          </div> */}

          {/* Divider */}
          <div style={{ width: "1px", background: "rgba(255,255,255,0.12)", margin: "10px 0", flexShrink: 0 }} />

          {/* ── DEPARTMENT DROPDOWN ── */}
          <div ref={deptRef} style={{ flex: "1 1 170px", position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "16px", color: dept ? "#c9a84c" : "rgba(255,255,255,0.4)", pointerEvents: "none", display: "flex", transition: "color .25s" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </span>
            <button onClick={() => { setDeptOpen(o => !o); }} aria-label="Select department" aria-expanded={deptOpen} aria-haspopup="listbox"
              style={{ width: "100%", height: "56px", paddingLeft: "42px", paddingRight: "32px", background: "transparent", border: "none", color: dept ? "#fff" : "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: '"Outfit",sans-serif', fontWeight: dept ? 600 : 400, cursor: "pointer", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {dept ? `${deptMeta[dept]?.emoji || "🏥"} ${dept}` : "Department"}
            </button>
            <span style={{ position: "absolute", right: "12px", color: "rgba(255,255,255,0.35)", pointerEvents: "none", display: "flex", transform: deptOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            {deptOpen && (
              <div role="listbox" aria-label="Department options" style={{ position: "absolute", top: "calc(100% + 10px)", left: "-10px", minWidth: "220px", background: "#0f2318", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "14px", overflow: "hidden", zIndex: 50, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", animation: "sugIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "300px", overflowY: "auto" }}>
                <button role="option" aria-selected={!dept} onMouseDown={() => { setDept(""); setDeptOpen(false);}}
                  style={{ width: "100%", padding: "10px 16px", background: !dept ? "rgba(201,168,76,0.12)" : "transparent", border: "none", color: !dept ? "#c9a84c" : "rgba(255,255,255,0.75)", fontSize: "13px", fontFamily: '"Outfit",sans-serif', cursor: "pointer", textAlign: "left" }}>
                  🏥 All Departments
                </button>
                {departments.filter(d => d !== "All").map((d, i) => (
                  <button key={i} role="option" aria-selected={dept === d} onMouseDown={() => { setDept(d); setDeptOpen(false);}}
                    style={{ width: "100%", padding: "10px 16px", background: dept === d ? "rgba(201,168,76,0.12)" : "transparent", border: "none", color: dept === d ? "#c9a84c" : "rgba(255,255,255,0.75)", fontSize: "13px", fontFamily: '"Outfit",sans-serif', fontWeight: dept === d ? 700 : 400, cursor: "pointer", textAlign: "left", transition: "background .15s" }}
                    onMouseEnter={e => { if (dept !== d) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { if (dept !== d) e.currentTarget.style.background = "transparent"; }}>
                    {deptMeta[d]?.emoji} {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── SEARCH BUTTON ── */}
          <button onClick={doSearch} aria-label="Search doctors"
            style={{
              flexShrink: 0, height: "56px", padding: "0 28px",
              background: "linear-gradient(135deg,#c9a84c,#e8d48a,#c9a84c)",
              backgroundSize: "200% 100%",
              border: "none", borderRadius: "14px", color: "#0f2318",
              fontSize: "14px", fontWeight: 800, fontFamily: '"Outfit",sans-serif',
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 6px 24px rgba(201,168,76,0.4)",
              transition: "all .25s cubic-bezier(.22,1,.36,1)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundPosition = "100% 0"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(201,168,76,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundPosition = "0 0"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(201,168,76,0.4)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
        </div>

        {/* ── POPULAR SEARCHES + ACTIVE FILTERS ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 700, fontFamily: '"Outfit",sans-serif', letterSpacing: "1px", textTransform: "uppercase", flexShrink: 0 }}>
            ⚡ Popular:
          </span>
          {POPULAR_SEARCHES.map((ps) => {
            const isActive = activeTags.includes(ps.label);
            return (
              <button key={ps.label} onClick={() => pickPopular(ps.label)} aria-pressed={isActive}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 13px", borderRadius: "999px",
                  background: isActive ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.07)",
                  border: `1px solid ${isActive ? "rgba(201,168,76,0.6)" : "rgba(255,255,255,0.12)"}`,
                  color: isActive ? "#c9a84c" : "rgba(255,255,255,0.6)",
                  fontSize: "12px", fontWeight: isActive ? 700 : 500,
                  fontFamily: '"Outfit",sans-serif', cursor: "pointer",
                  transition: "all .22s cubic-bezier(.22,1,.36,1)",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; } }}
              >
                <span>{ps.emoji}</span> {ps.label}
                {isActive && (
                  <span style={{ marginLeft: "2px", opacity: 0.7, fontSize: "10px" }}>✕</span>
                )}
              </button>
            );
          })}
          {hasFilters && (
            <button onClick={clearAll}
              style={{ marginLeft: "auto", padding: "5px 13px", borderRadius: "999px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "11px", fontWeight: 700, fontFamily: '"Outfit",sans-serif', cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sugIn { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .sb-input::placeholder { color: rgba(255,255,255,0.35) !important; }
        @media(max-width:900px){
          .sb-wrap { padding: 0 16px !important; }
        }
      `}</style>
    </div>
  );
};


// ── Modal ─────────────────────────────────────────────────────────────────────
const DoctorModal = ({ doctor, onClose, navigate, currentUser, isAuthenticated }) => {
  const meta = deptMeta[doctor.doctorDepartment] || { accent: "#1a3d2e", bg: "#f0fdf4", light: "#dcfce7", emoji: "🏥" };
  const [imgError, setImgError]         = useState(false);
  const [reviews, setReviews]           = useState([]);
  const [avgRating, setAvgRating]       = useState(0);
  const [loadingRev, setLoadingRev]     = useState(true);
  const [rating, setRating]             = useState(5);
  const [comment, setComment]           = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [editId, setEditId]             = useState(null);
  const [editRating, setEditRating]     = useState(5);
  const [editComment, setEditComment]   = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeTab, setActiveTab]       = useState("info");
  const availableDates = getAvailableDates(["Mon","Tue","Wed","Thu","Fri","Sat"], 10);
  const dateScrollRef = useRef(null);

  const avatarSrc = (!imgError && doctor.docAvatar?.url) ? doctor.docAvatar.url : getDoctorAvatar(doctor);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login"}/api/v1/review/doctor/${doctor._id}`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.avgRating || 0);
    } catch (err) {
      console.error("Review fetch failed:", err);
      setReviews([]); setAvgRating(0);
    }
    setLoadingRev(false);
  };

  useEffect(() => {
    fetchReviews();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBook = () => {
    onClose();
    navigate(`/appointment?department=${encodeURIComponent(doctor.doctorDepartment)}&doctor_firstName=${encodeURIComponent(doctor.firstName)}&doctor_lastName=${encodeURIComponent(doctor.lastName)}`);
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) return toast.error("Please write a comment!");
    if (comment.trim().length < 10) return toast.error("Comment must be at least 10 characters!");
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login"}/api/v1/review/doctor/${doctor._id}/post`, { rating, comment }, { withCredentials: true });
      toast.success("Review posted!"); setComment(""); setRating(5); fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post review"); }
    setSubmitting(false);
  };

  const handleUpdateReview = async () => {
    if (editComment.trim().length < 10) return toast.error("Comment must be at least 10 characters!");
    setEditSubmitting(true);
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login"}/api/v1/review/update/${editId}`, { rating: editRating, comment: editComment }, { withCredentials: true });
      toast.success("Review updated!"); setEditId(null); fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update review"); }
    setEditSubmitting(false);
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login"}/api/v1/review/delete/${id}`, { withCredentials: true });
      toast.success("Review deleted!"); fetchReviews();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete review"); }
  };

  const myReview = (reviews || []).find(r => r.patientId?.toString() === currentUser?._id?.toString());

  return (
    <>
    <style>{`
      @keyframes slideUp { from{opacity:0;transform:translateY(44px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes revIn   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
      .m-band{height:4px;width:100%;flex-shrink:0;position:sticky;top:0;z-index:5}
      .m-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(0,0,0,.12);background:rgba(255,255,255,.9);color:#444;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:20;transition:all .22s;font-weight:700}
      .m-close:hover{background:#f5f5f5;transform:rotate(90deg) scale(1.1)}
      .m-hero{position:relative;padding:22px 22px 0;animation:revIn .35s .05s both}
      .m-hero-inner{display:flex;gap:16px;align-items:flex-start}
      .m-avatar-frame{width:80px;height:80px;border-radius:16px;overflow:hidden;border:2px solid;box-shadow:0 6px 20px rgba(0,0,0,.14);flex-shrink:0}
      .m-avatar-img{width:100%;height:100%;object-fit:cover}
      .m-hero-info{flex:1;min-width:0}
      .m-name{font-size:20px;font-weight:800;color:#0f172a;font-family:"Outfit",sans-serif;margin:0 0 3px;line-height:1.2}
      .m-specialty{font-size:13px;color:#64748b;margin:0 0 8px;font-family:"Outfit",sans-serif}
      .m-dept-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.5px;font-family:"Outfit",sans-serif;border:1px solid;text-transform:uppercase;white-space:nowrap}
      .m-rating-row{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap}
      .m-avg-num{font-size:13px;font-weight:800;color:#0f172a;font-family:"Outfit",sans-serif}
      .m-rev-count{font-size:12px;color:#64748b;font-family:"Outfit",sans-serif}
      .m-stats-row{display:grid;grid-template-columns:repeat(4,1fr);margin:16px 22px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden}
      .m-stat{padding:12px 0;display:flex;flex-direction:column;align-items:center;gap:3px;border-right:1px solid #e2e8f0;transition:background .2s}
      .m-stat:last-child{border-right:none}
      .m-stat:hover{background:#fff}
      .m-stat-icon{font-size:14px}.m-stat-val{font-size:14px;font-weight:800;color:#0f172a;font-family:"Outfit",sans-serif}.m-stat-lbl{font-size:10px;color:#64748b;font-weight:500;font-family:"Outfit",sans-serif}
      .m-tabs{display:flex;gap:0;margin:0 22px;border-bottom:2px solid #e2e8f0}
      .m-tab{padding:10px 18px;background:none;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;color:#94a3b8;position:relative;transition:color .2s}
      .m-tab.active{color:#0f172a}
      .m-tab.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;border-radius:2px}
      .m-info-section{padding:16px 22px 0}
      .m-info-block{margin-bottom:14px}
      .m-info-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;font-family:"Outfit",sans-serif}
      .m-info-text{font-size:13.5px;color:#334155;line-height:1.65;font-family:"Outfit",sans-serif}
      .m-info-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f1f5f9}
      .m-info-row:last-child{border-bottom:none}
      .m-info-icon{font-size:14px;flex-shrink:0;width:20px;text-align:center}
      .m-info-val{font-size:13px;color:#334155;font-family:"Outfit",sans-serif}
      .m-lang-pills{display:flex;gap:6px;flex-wrap:wrap}
      .m-lang-pill{padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:#f1f5f9;color:#475569;font-family:"Outfit",sans-serif}
      .m-date-section{padding:16px 22px 0}
      .m-section-title{font-size:13px;font-weight:800;color:#0f172a;margin-bottom:10px;font-family:"Outfit",sans-serif}
      .m-dates-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
      .m-dates-scroll::-webkit-scrollbar{display:none}
      .m-date-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 14px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-family:"Outfit",sans-serif;transition:all .2s;flex-shrink:0;min-width:58px}
      .m-date-btn:hover{border-color:var(--m-accent);background:var(--m-bg)}
      .m-date-btn.active{background:var(--m-accent);border-color:var(--m-accent);color:#fff !important}
      .m-date-day{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
      .m-date-num{font-size:18px;font-weight:800;color:#0f172a}
      .m-date-month{font-size:10px;color:#94a3b8;font-weight:600}
      .m-date-btn.active .m-date-day,.m-date-btn.active .m-date-num,.m-date-btn.active .m-date-month{color:#fff}
      .m-slots-section{padding:14px 22px 0}
      .m-slots-grid{display:flex;gap:8px;flex-wrap:wrap}
      .m-slot-btn{padding:7px 13px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:"Outfit",sans-serif;color:#475569;transition:all .2s;white-space:nowrap}
      .m-slot-btn:hover{border-color:var(--m-accent);color:var(--m-accent)}
      .m-slot-btn.active{background:var(--m-accent);border-color:var(--m-accent);color:#fff}
      .m-action-row{display:flex;gap:10px;padding:16px 22px;margin-top:4px}
      .m-book-btn{display:flex;align-items:center;justify-content:center;gap:8px;flex:1;padding:12px;background:linear-gradient(135deg,#1a3d2e,#2a5c42);border:none;border-radius:12px;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;transition:all .2s;box-shadow:0 4px 14px rgba(26,61,46,.28)}
      .m-book-btn:hover{opacity:.88;transform:translateY(-1px);box-shadow:0 8px 22px rgba(26,61,46,.36)}
      .m-sep{height:1px;background:#e2e8f0;margin:4px 0}
      .m-reviews{padding:16px 22px 26px}
      .m-reviews-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
      .m-reviews-title{font-size:15px;font-weight:800;color:#0f172a;font-family:"Outfit",sans-serif}
      .m-reviews-avg-badge{font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;font-family:"Outfit",sans-serif}
      .m-form{background:#f8fafc;border-radius:14px;border:1.5px solid #e2e8f0;padding:14px;margin-bottom:18px}
      .m-form-label{font-size:12px;font-weight:700;color:#0f172a;margin:0 0 8px;font-family:"Outfit",sans-serif}
      .m-textarea{width:100%;margin-top:10px;padding:10px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#0f172a;font-size:13px;font-family:"Outfit",sans-serif;resize:vertical;outline:none;transition:border-color .2s;box-sizing:border-box}
      .m-textarea:focus{border-color:#1a3d2e;box-shadow:0 0 0 3px rgba(26,61,46,.1)}
      .m-form-foot{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
      .m-char{font-size:11px;color:#94a3b8;font-family:"Outfit",sans-serif}
      .m-submit{padding:8px 18px;border:none;border-radius:9px;color:white;font-size:12px;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;transition:opacity .2s,transform .2s}
      .m-submit:hover{opacity:.85;transform:translateY(-1px)}.m-submit:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .m-login-prompt{padding:13px 15px;background:#f8fafc;border-radius:12px;border:1.5px dashed #e2e8f0;font-size:13px;color:#94a3b8;margin-bottom:18px;font-family:"Outfit",sans-serif}
      .m-login-link{background:none;border:none;color:#1a3d2e;font-weight:700;cursor:pointer;text-decoration:underline;font-size:13px;padding:0;font-family:"Outfit",sans-serif}
      .m-already{font-size:13px;color:#16a34a;font-weight:600;margin-bottom:16px;padding:10px 14px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;font-family:"Outfit",sans-serif}
      .m-rev-list{display:flex;flex-direction:column;gap:10px}
      .m-rev-loading{text-align:center;color:#94a3b8;font-size:13px;padding:20px 0;font-family:"Outfit",sans-serif}
      .m-no-reviews{text-align:center;padding:28px 0;color:#94a3b8;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:8px;font-family:"Outfit",sans-serif}
      .m-no-reviews span{font-size:32px;opacity:.5}
      .m-rev-card{background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:13px;animation:revIn .3s ease both;transition:box-shadow .2s}
      .m-rev-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.07)}
      .m-rev-top{display:flex;align-items:center;gap:10px;margin-bottom:9px}
      .m-rev-avatar{width:34px;height:34px;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0}
      .m-rev-info{flex:1;display:flex;flex-direction:column;gap:2px}
      .m-rev-name{font-size:13px;font-weight:700;color:#0f172a;font-family:"Outfit",sans-serif}
      .m-rev-date{font-size:11px;color:#94a3b8;font-family:"Outfit",sans-serif}
      .m-rev-comment{font-size:13px;color:#64748b;line-height:1.6;margin:0;font-family:"Outfit",sans-serif}
      .m-rev-actions{display:flex;gap:8px;margin-top:10px}
      .m-edit-btn{padding:5px 11px;border-radius:7px;border:1px solid #e2e8f0;background:transparent;font-size:11px;font-weight:600;cursor:pointer;color:#94a3b8;font-family:"Outfit",sans-serif;transition:all .2s}
      .m-edit-btn:hover{background:#fff;color:#0f172a}
      .m-del-btn{padding:5px 11px;border-radius:7px;border:1px solid #fecaca;background:transparent;font-size:11px;font-weight:600;cursor:pointer;color:#ef4444;font-family:"Outfit",sans-serif;transition:all .2s}
      .m-del-btn:hover{background:#fef2f2}
      .m-edit-form{display:flex;flex-direction:column;gap:8px}
      .m-edit-btns{display:flex;gap:8px}
      .m-save-btn{padding:7px 15px;border:none;border-radius:8px;color:white;font-size:12px;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;transition:opacity .2s}
      .m-save-btn:hover{opacity:.85}.m-save-btn:disabled{opacity:.5;cursor:not-allowed}
      .m-cancel-btn{padding:7px 15px;background:transparent;border:1.5px solid #e2e8f0;border-radius:8px;color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;font-family:"Outfit",sans-serif;transition:all .2s}
      .m-cancel-btn:hover{background:#f8fafc}
      .m-rev-card:nth-child(1){animation-delay:.04s}.m-rev-card:nth-child(2){animation-delay:.09s}.m-rev-card:nth-child(3){animation-delay:.14s}.m-rev-card:nth-child(4){animation-delay:.19s}.m-rev-card:nth-child(5){animation-delay:.24s}
      @media(max-width:900px){
        .m-stats-row{grid-template-columns:repeat(2,1fr)}
        .m-stat:nth-child(2){border-right:none}
        .m-stat:nth-child(3){border-top:1px solid #e2e8f0}
        .m-stat:nth-child(4){border-top:1px solid #e2e8f0}
        .m-hero-inner{flex-direction:column;align-items:center;text-align:center}
        .m-rating-row{justify-content:center}
        .m-lang-pills{justify-content:center}
      }
    `}</style>
    <div className="m-backdrop" onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",animation:"fadeIn .18s ease" }}>
      <div className="m-box" onClick={e => e.stopPropagation()} style={{
        "--m-accent": meta.accent, "--m-bg": meta.bg,
        background:"#ffffff",borderRadius:"22px",width:"100%",maxWidth:"560px",maxHeight:"90vh",
        overflowY:"auto",overflowX:"hidden",position:"relative",
        border:"1.5px solid #e2e8f0",animation:"slideUp .35s cubic-bezier(.22,1,.36,1)",scrollbarWidth:"thin"
      }}>
        <div className="m-band" style={{ background:`linear-gradient(90deg, ${meta.accent}, ${meta.accent}99)` }} />
        <button className="m-close" onClick={onClose}>✕</button>
        <div className="m-hero">
          <div className="m-hero-inner">
            <div className="m-avatar-frame" style={{ borderColor:`${meta.accent}40`,background:meta.light }}>
              <img src={avatarSrc} alt={`Dr. ${doctor.firstName}`} onError={() => setImgError(true)} className="m-avatar-img" />
            </div>
            <div className="m-hero-info">
              <h2 className="m-name">Dr. {doctor.firstName} {doctor.lastName}</h2>
              <p className="m-specialty">{doctor.doctorDepartment} Specialist</p>
              <span className="m-dept-pill" style={{ color:meta.accent,background:meta.bg,borderColor:`${meta.accent}40` }}>{meta.emoji} {doctor.doctorDepartment}</span>
              <div className="m-rating-row">
                <StarDisplay rating={avgRating} size={14} />
                <span className="m-avg-num">{avgRating > 0 ? Number(avgRating).toFixed(1) : "—"}</span>
                <span className="m-rev-count">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="m-stats-row">
          {[
            {icon:"🏆",val:"10+",lbl:"Years Exp"},
            {icon:"👥",val:"500+",lbl:"Patients"},
            {icon:"⭐",val:avgRating>0?Number(avgRating).toFixed(1):"New",lbl:"Rating"},
            {icon:"💬",val:reviews.length,lbl:"Reviews"}
          ].map((s,i) => (
            <div key={i} className="m-stat">
              <span className="m-stat-icon">{s.icon}</span>
              <span className="m-stat-val">{s.val}</span>
              <span className="m-stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
        <div className="m-tabs">
          {["info","reviews"].map(tab => (
            <button key={tab} className={`m-tab ${activeTab===tab?"active":""}`}
              onClick={() => setActiveTab(tab)}
              style={activeTab===tab ? {"--tab-color":meta.accent} : {}}
            >
              {tab === "info" ? "📋 Info & Booking" : `💬 Reviews (${reviews.length})`}
              {activeTab===tab && <span style={{position:"absolute",bottom:"-2px",left:0,right:0,height:"2px",borderRadius:"2px",background:meta.accent,display:"block"}} />}
            </button>
          ))}
        </div>
        {activeTab === "info" && (
          <>
            <div className="m-info-section">
              <div className="m-info-block">
                <div className="m-info-label">About</div>
                <div style={{background:"#f8fafc",borderRadius:"12px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div className="m-info-row" style={{padding:"9px 12px"}}><span className="m-info-icon">🎓</span><span className="m-info-val">MBBS, MD ({doctor.doctorDepartment}) — Top Medical University</span></div>
                  <div className="m-info-row" style={{padding:"9px 12px"}}><span className="m-info-icon">🏆</span><span className="m-info-val">10+ Years of Clinical Experience</span></div>
                  <div className="m-info-row" style={{padding:"9px 12px"}}><span className="m-info-icon">🕐</span><span className="m-info-val">Mon – Sat &nbsp;·&nbsp; 9:00 AM – 5:00 PM</span></div>
                  <div className="m-info-row" style={{padding:"9px 12px"}}><span className="m-info-icon">🌐</span><div><div className="m-lang-pills">{["English","Hindi","Odia"].map(l => <span key={l} className="m-lang-pill">{l}</span>)}</div></div></div>
                  <div className="m-info-row" style={{padding:"9px 12px"}}><span className="m-info-icon">📍</span><span className="m-info-val">Cliniqo Hospital, Bhubaneswar</span></div>
                </div>
              </div>
            </div>
            <div className="m-date-section">
              <div className="m-section-title">Select Date</div>
              <div className="m-dates-scroll" ref={dateScrollRef}>
                {availableDates.map((date, idx) => (
                  <button key={idx} className={`m-date-btn ${selectedDate === idx ? "active" : ""}`}
                    onClick={() => { setSelectedDate(idx); setSelectedSlot(null); }}
                    style={{"--m-accent":meta.accent,"--m-bg":meta.bg}}>
                    <span className="m-date-day">{DAY_NAMES[date.getDay()]}</span>
                    <span className="m-date-num">{date.getDate()}</span>
                    <span className="m-date-month">{MONTH_NAMES[date.getMonth()]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="m-slots-section">
              <div className="m-section-title">Available Slots</div>
              <div className="m-slots-grid">
                {TIME_SLOTS.map((slot, idx) => (
                  <button key={idx} className={`m-slot-btn ${selectedSlot === slot ? "active" : ""}`}
                    onClick={() => setSelectedSlot(slot)} style={{"--m-accent":meta.accent}}>{slot}</button>
                ))}
              </div>
            </div>
            <div className="m-action-row">
              {/* <button className="m-call-btn" onClick={() => toast.info("Calling feature coming soon!")}>📞 Call</button> */}
              <button className="m-book-btn" onClick={handleBook}>📅 Book Appointment →</button>
            </div>
          </>
        )}
        {activeTab === "reviews" && (
          <div className="m-reviews">
            <div className="m-reviews-head">
              <span className="m-reviews-title">Patient Reviews</span>
              {reviews.length > 0 && <span className="m-reviews-avg-badge" style={{ color:meta.accent,background:meta.bg }}>{Number(avgRating).toFixed(1)} ★ avg</span>}
            </div>
            {isAuthenticated ? (myReview ? (
              <div className="m-already">✅ You've already reviewed this doctor.</div>
            ) : (
              <div className="m-form">
                <p className="m-form-label">Your Rating</p>
                <StarInput value={rating} onChange={setRating} />
                <textarea className="m-textarea" placeholder="Share your experience… (min 10 characters)" value={comment} onChange={e => setComment(e.target.value)} maxLength={500} rows={3} />
                <div className="m-form-foot">
                  <span className="m-char">{comment.length}/500</span>
                  <button className="m-submit" onClick={handleSubmitReview} disabled={submitting} style={{ background:meta.accent }}>{submitting?"Posting…":"Post Review"}</button>
                </div>
              </div>
            )) : (
              <div className="m-login-prompt">🔒 <button className="m-login-link" onClick={() => { onClose(); navigate("/login"); }}>Sign in</button> to leave a review</div>
            )}
            <div className="m-rev-list">
              {loadingRev ? (<p className="m-rev-loading">Loading reviews…</p>
              ) : reviews.length === 0 ? (
                <div className="m-no-reviews"><span>💬</span><p>No reviews yet. Be the first!</p></div>
              ) : reviews.map((rev, idx) => (
                <div key={rev._id} className="m-rev-card" style={{ animationDelay:`${idx*60}ms` }}>
                  {editId === rev._id ? (
                    <div className="m-edit-form">
                      <StarInput value={editRating} onChange={setEditRating} />
                      <textarea className="m-textarea" value={editComment} onChange={e => setEditComment(e.target.value)} rows={3} />
                      <div className="m-edit-btns">
                        <button className="m-save-btn" onClick={handleUpdateReview} disabled={editSubmitting} style={{ background:meta.accent }}>{editSubmitting?"Saving…":"Save"}</button>
                        <button className="m-cancel-btn" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="m-rev-top">
                        <div className="m-rev-avatar" style={{ background:meta.accent }}>{rev.patientName?.charAt(0).toUpperCase()||"?"}</div>
                        <div className="m-rev-info">
                          <span className="m-rev-name">{rev.patientName}</span>
                          <span className="m-rev-date">{new Date(rev.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                        </div>
                        <StarDisplay rating={rev.rating} size={13} />
                      </div>
                      <p className="m-rev-comment">{rev.comment}</p>
                      {currentUser && rev.patientId?.toString() === currentUser._id?.toString() && (
                        <div className="m-rev-actions">
                          <button className="m-edit-btn" onClick={() => { setEditId(rev._id); setEditRating(rev.rating); setEditComment(rev.comment); }}>✏️ Edit</button>
                          <button className="m-del-btn" onClick={() => handleDeleteReview(rev._id)}>🗑️ Delete</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

// ── Doctor Card ───────────────────────────────────────────────────────────────
const useInView = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const DoctorCard = ({ doctor, index, onOpenModal }) => {
  const [cardRef, inView] = useInView();
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meta = deptMeta[doctor.doctorDepartment] || { accent: "#1a3d2e", bg: "#f0fdf4", light: "#dcfce7", emoji: "🏥" };
  const avatarSrc = (!imgError && doctor.docAvatar?.url) ? doctor.docAvatar.url : getDoctorAvatar(doctor);

  return (
    <div
      ref={cardRef}
      className={`dc ${inView ? "dc-in" : ""}`}
      style={{ "--ac": meta.accent, "--ab": meta.bg, "--al": meta.light, animationDelay: `${(index % 6) * 80}ms` }}
      onClick={() => onOpenModal(doctor)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="dc-left-bar" style={{ background: meta.accent }} />
      <div className="dc-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${meta.accent}18 0%, transparent 70%)`, opacity: hovered ? 1 : 0 }} />
      <div className="dc-top" style={{ background: `linear-gradient(160deg, ${meta.light} 0%, #fff 60%)` }}>
        <div className="dc-avatar-wrap">
          <div className="dc-avatar-ring" style={{ borderColor: `${meta.accent}30` }}>
            <div className="dc-avatar-inner" style={{ boxShadow: hovered ? `0 0 0 3px ${meta.accent}40` : "none" }}>
              <img className="dc-avatar-img" src={avatarSrc} alt={`Dr. ${doctor.firstName}`} onError={() => setImgError(true)} />
            </div>
          </div>
          <div className="dc-online-dot" style={{ background: meta.accent, boxShadow: `0 0 0 2px white, 0 0 0 4px ${meta.accent}40` }} />
        </div>
        <span className="dc-dept-badge" style={{ color: meta.accent, background: "white", borderColor: `${meta.accent}25`, boxShadow: `0 2px 8px ${meta.accent}15` }}>
          {meta.emoji} {doctor.doctorDepartment}
        </span>
      </div>
      <div className="dc-info">
        <h3 className="dc-name">Dr. {doctor.firstName} {doctor.lastName}</h3>
        <p className="dc-role">{doctor.doctorDepartment} Specialist</p>
      </div>
      <div className="dc-div" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}30, transparent)` }} />
      <div className="dc-footer">
        <div className="dc-gender-tag" style={{
          color: doctor.gender === "Female" ? "#be185d" : "#1a3d2e",
          background: doctor.gender === "Female" ? "#fdf2f8" : "#f0fdf4",
          border: `1px solid ${doctor.gender === "Female" ? "#fbcfe840" : "#bbf7d040"}`,
        }}>
          {doctor.gender === "Female" ? "👩‍⚕️" : "👨‍⚕️"} {doctor.gender || "Doctor"}
        </div>
        <button
          className="dc-btn"
          style={{
            color: hovered ? "white" : meta.accent,
            background: hovered ? meta.accent : "transparent",
            borderColor: meta.accent,
            boxShadow: hovered ? `0 4px 12px ${meta.accent}40` : "none",
          }}
          onClick={e => { e.stopPropagation(); onOpenModal(doctor); }}
        >
          View Profile <span className="dc-arrow" style={{ transform: hovered ? "translateX(3px)" : "none" }}>→</span>
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Doctors = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(Context);
  const [doctors, setDoctors]         = useState([]);
  const [active, setActive]           = useState("All");
  const [loading, setLoading]         = useState(true);
  const [heroVis, setHeroVis]         = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // ── Search state ────────────────────────────────────────────────────────────
  const [searchFilters, setSearchFilters] = useState({ query: "", city: "", dept: "" });

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setHeroVis(true), 80);
    const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";
    axios.get(`${BASE}/api/v1/user/doctors`)
      .then(res => { setDoctors(res.data.doctors || []); setLoading(false); })
      .catch((err) => { console.error("Doctors fetch error:", err.message); setLoading(false); });
  }, []);

  // ── Combined filter: category tab + search bar ───────────────────────────
  const filtered = doctors.filter(d => {
    // Category filter tab
    const tabMatch = active === "All" || d.doctorDepartment === active;

    // Search query: match name or department
    const q = searchFilters.query.toLowerCase().replace(/^dr\.?\s*/i, "");
    const nameMatch = q
      ? (`${d.firstName} ${d.lastName}`).toLowerCase().includes(q) ||
        (d.doctorDepartment || "").toLowerCase().includes(q)
      : true;

    // Department dropdown from search bar
    const deptMatch = searchFilters.dept
      ? d.doctorDepartment === searchFilters.dept
      : true;

    return tabMatch && nameMatch && deptMatch;
  });

  const hasSearchActive = searchFilters.query || searchFilters.city || searchFilters.dept;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Outfit:wght@400;500;600;700;800&display=swap');

        @keyframes heroUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn   { from{opacity:0;transform:translateY(32px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(44px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes revIn    { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes goldGlow { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes popIn    { 0%{transform:scale(.85)} 60%{transform:scale(1.05)} 100%{transform:scale(1)} }
        @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.92)} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes barIn    { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes sugIn    { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        .dh{padding:88px 80px 44px;background:linear-gradient(145deg,#091c10 0%,#1a3d2e 50%,#1e4d38 100%);position:relative;overflow:hidden;min-height:300px;display:flex;align-items:center;}
        .dh::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:40px 40px;}
        .dh-gold-line{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent 0%,#c9a84c 25%,#e8d48a 50%,#c9a84c 75%,transparent 100%);animation:goldGlow 4s ease-in-out infinite}
        .dh-blob{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none}
        .dh-blob-1{width:380px;height:380px;top:-80px;right:-60px;background:rgba(201,168,76,.10)}
        .dh-blob-2{width:280px;height:280px;bottom:-60px;left:8%;background:rgba(74,222,128,.07)}
        .dh-inner{position:relative;z-index:1;opacity:0;max-width:640px}
        .dh-inner.vis{animation:heroUp .85s cubic-bezier(.22,1,.36,1) forwards}
        .dh-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(201,168,76,.13);border:1px solid rgba(201,168,76,.28);color:#d4ac4e;padding:5px 16px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:22px;font-family:"Outfit",sans-serif}
        .dh-tag-dot{width:6px;height:6px;border-radius:50%;background:#c9a84c;animation:goldGlow 2s infinite}
        .dh-inner h1{color:white;font-family:'Cormorant Garamond',serif;font-size:clamp(34px,5vw,54px);font-weight:700;line-height:1.1;margin:0 0 14px;letter-spacing:-.5px}
        .dh-inner h1 em{font-style:italic;color:#c9a84c}
        .dh-sub{color:rgba(255,255,255,.6);font-size:15px;line-height:1.75;max-width:440px;margin:0 0 32px;font-family:"Outfit",sans-serif}
        .dh-stats{display:flex;gap:10px;flex-wrap:wrap}
        .dh-stat-pill{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 16px;animation:heroUp .85s cubic-bezier(.22,1,.36,1) forwards;opacity:0}
        .dh-stat-pill:nth-child(1){animation-delay:.12s}.dh-stat-pill:nth-child(2){animation-delay:.2s}.dh-stat-pill:nth-child(3){animation-delay:.28s}
        .dh-stat-icon{font-size:18px}
        .dh-stat-val{font-size:18px;font-weight:800;color:white;font-family:"Outfit",sans-serif;line-height:1}
        .dh-stat-lbl{font-size:11px;color:rgba(255,255,255,.5);font-weight:600;text-transform:uppercase;letter-spacing:.5px;font-family:"Outfit",sans-serif}

        .df-wrap{background:var(--bg-card,#fff);border-bottom:1px solid var(--border,#e5e7eb);padding:0 80px;position:sticky;top:68px;z-index:10;box-shadow:0 2px 10px rgba(0,0,0,.05)}
        .df-inner{display:flex;gap:4px;overflow-x:auto;padding:10px 0;scrollbar-width:none;max-width:1200px;margin:0 auto}
        .df-inner::-webkit-scrollbar{display:none}
        .df-btn{padding:7px 16px;border-radius:8px;border:none;background:transparent;color:var(--text-gray,#6b7280);font-size:12px;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;transition:all .2s;white-space:nowrap;flex-shrink:0}
        .df-btn:hover{background:var(--bg-alt,#f5f7f5);color:var(--text-dark,#111)}
        .df-btn.df-on{background:#1a3d2e;color:white;box-shadow:0 3px 10px rgba(26,61,46,.25);animation:popIn .22s ease}

        .db{padding:44px 80px 80px;background:var(--bg-alt,#f5f7f5);position:relative;}
        .db::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--border,#e5e7eb) 1px,transparent 1px),linear-gradient(90deg,var(--border,#e5e7eb) 1px,transparent 1px);background-size:48px 48px;opacity:.5;}
        .db-meta{font-size:13px;color:var(--text-gray,#6b7280);font-weight:500;margin-bottom:28px;font-family:"Outfit",sans-serif;position:relative;z-index:1}
        .db-meta strong{color:var(--text-dark,#111);font-weight:800}
        .dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px;position:relative;z-index:1}

        .dc{background:#fff;border-radius:16px;border:1.5px solid var(--border,#e5e7eb);overflow:hidden;opacity:0;cursor:pointer;display:flex;flex-direction:column;position:relative;transition:box-shadow .35s cubic-bezier(.22,1,.36,1),transform .35s cubic-bezier(.22,1,.36,1),border-color .25s ease;}
        .dc.dc-in{animation:cardIn .55s cubic-bezier(.22,1,.36,1) forwards}
        .dc:hover{box-shadow:0 20px 50px rgba(0,0,0,.13),0 4px 16px rgba(0,0,0,.06);transform:translateY(-7px) scale(1.01);border-color:var(--ac);}
        .dc-left-bar{position:absolute;left:0;top:0;bottom:0;width:3px;transform-origin:top;animation:barIn .4s ease forwards;animation-play-state:paused;border-radius:0 2px 2px 0;}
        .dc.dc-in .dc-left-bar{animation-play-state:running}
        .dc-glow{position:absolute;inset:0;pointer-events:none;transition:opacity .35s ease;z-index:0;border-radius:16px;}
        .dc-top{padding:28px 0 18px;display:flex;flex-direction:column;align-items:center;gap:13px;position:relative;z-index:1;}
        .dc-avatar-wrap{position:relative;display:inline-block}
        .dc-avatar-ring{width:88px;height:88px;border-radius:50%;border:2px solid;padding:3px;transition:border-color .3s,transform .35s cubic-bezier(.22,1,.36,1);}
        .dc:hover .dc-avatar-ring{transform:scale(1.06)}
        .dc-avatar-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;transition:box-shadow .3s;}
        .dc-avatar-img{width:100%;height:100%;object-fit:cover;display:block}
        .dc-online-dot{position:absolute;bottom:4px;right:4px;width:12px;height:12px;border-radius:50%;animation:pulse 2.5s ease-in-out infinite;}
        .dc-dept-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 13px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.5px;font-family:"Outfit",sans-serif;border:1px solid;text-transform:uppercase;transition:transform .2s;}
        .dc:hover .dc-dept-badge{transform:translateY(-1px)}
        .dc-info{padding:0 20px 16px;text-align:center;flex:1;position:relative;z-index:1}
        .dc-name{font-size:15px;font-weight:800;line-height:1.25;color:var(--text-dark,#111);margin:0 0 5px;font-family:"Outfit",sans-serif;transition:color .2s;}
        .dc:hover .dc-name{color:var(--ac)}
        .dc-role{font-size:12px;color:var(--text-gray,#6b7280);margin:0;font-family:"Outfit",sans-serif}
        .dc-div{height:1px;margin:0 20px;transition:opacity .3s}
        .dc-footer{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;position:relative;z-index:1;}
        .dc-gender-tag{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;font-family:"Outfit",sans-serif;}
        .dc-btn{display:flex;align-items:center;gap:5px;padding:7px 15px;border-radius:999px;border:1.5px solid;font-size:11px;font-weight:700;cursor:pointer;font-family:"Outfit",sans-serif;transition:all .25s cubic-bezier(.22,1,.36,1);}
        .dc-arrow{display:inline-block;transition:transform .25s}

        .d-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;gap:16px;position:relative;z-index:1}
        .d-spinner{width:38px;height:38px;border-radius:50%;border:3px solid #e5e7eb;border-top-color:#1a3d2e;animation:spin .75s linear infinite}
        .d-empty{text-align:center;padding:80px 0;color:var(--text-gray,#6b7280);font-family:"Outfit",sans-serif;position:relative;z-index:1}
        .d-empty-icon{font-size:44px;margin-bottom:12px}

        .m-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .18s ease}
        .m-box{background:#fff;border-radius:22px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;overflow-x:hidden;position:relative;animation:slideUp .35s cubic-bezier(.22,1,.36,1);border:1.5px solid #e2e8f0;scrollbar-width:thin}

        @media(max-width:900px){
          .dh{padding:68px 24px 36px}
          .df-wrap{padding:0 16px}
          .db{padding:28px 16px 60px}
          .dg{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
          .m-box{max-height:94vh;border-radius:18px}
        }
      `}</style>

      <div style={{ paddingTop: "70px" }}>
        {/* ── HERO ── */}
        <section className="dh">
          <div className="dh-gold-line" />
          <div className="dh-blob dh-blob-1" />
          <div className="dh-blob dh-blob-2" />
          <div className={`dh-inner ${heroVis ? "vis" : ""}`}>
            <div className="dh-tag"><span className="dh-tag-dot" /> Our Medical Team</div>
            <h1>Meet Our <em>Expert</em><br />Doctors</h1>
            <p className="dh-sub">Browse our team of experienced specialists. Find the right doctor and book your appointment in seconds.</p>
            <div className="dh-stats">
              <div className="dh-stat-pill"><span className="dh-stat-icon">👨‍⚕️</span><div><div className="dh-stat-val">54+</div><div className="dh-stat-lbl">Doctors</div></div></div>
              <div className="dh-stat-pill"><span className="dh-stat-icon">🏥</span><div><div className="dh-stat-val">9</div><div className="dh-stat-lbl">Departments</div></div></div>
              <div className="dh-stat-pill"><span className="dh-stat-icon">⭐</span><div><div className="dh-stat-val">4.9</div><div className="dh-stat-lbl">Avg Rating</div></div></div>
            </div>
          </div>
        </section>

        {/* ── PREMIUM SEARCH BAR (inserted between hero & filters) ── */}
        <DoctorSearchBar doctors={doctors} onSearch={setSearchFilters} />

        {/* ── CATEGORY FILTER TAB BAR ── */}
        <div className="df-wrap">
          <div className="df-inner">
            {departments.map(dept => (
              <button key={dept} className={`df-btn ${active === dept ? "df-on" : ""}`} onClick={() => setActive(dept)}>
                {dept !== "All" && deptMeta[dept] ? deptMeta[dept].emoji + " " : ""}{dept}
              </button>
            ))}
          </div>
        </div>

        {/* ── DOCTOR GRID ── */}
        <section className="db">
          {loading ? (
            <div className="d-loading"><div className="d-spinner" /><p style={{ color:"var(--text-gray)",fontFamily:'"Outfit",sans-serif' }}>Loading doctors…</p></div>
          ) : filtered.length === 0 ? (
            <div className="d-empty">
              <div className="d-empty-icon">🔍</div>
              <p style={{ fontFamily:'"Outfit",sans-serif', fontWeight: 700, color: "#111", marginBottom: "6px" }}>
                {hasSearchActive ? "No doctors match your search." : "No doctors found for this department."}
              </p>
              {hasSearchActive && (
                <p style={{ fontFamily:'"Outfit",sans-serif', fontSize: "13px", color: "#6b7280" }}>
                  Try different keywords or clear the search filters.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="db-meta">
                Showing <strong>{filtered.length}</strong> doctor{filtered.length !== 1 ? "s" : ""}
                {active !== "All" ? <> in <strong>{active}</strong></> : ""}
                {searchFilters.query ? <> matching <strong>"{searchFilters.query}"</strong></> : ""}
                {searchFilters.dept && !searchFilters.query ? <> in <strong>{searchFilters.dept}</strong></> : ""}
              </p>
              <div className="dg">
                {filtered.map((doc, i) => (
                  <DoctorCard key={doc._id} doctor={doc} index={i} onOpenModal={setSelectedDoctor} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {selectedDoctor && (
        <DoctorModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          navigate={navigate}
          currentUser={user}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
};

export default Doctors;
