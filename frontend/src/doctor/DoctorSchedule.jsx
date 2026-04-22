import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaCalendarTimes, FaCheckCircle, FaClock, FaPlus, FaTrash, FaSave, FaLock, FaUnlock } from "react-icons/fa";

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";

// ── All original constants preserved ──
const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS = { monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun" };
const DAY_FULL   = { monday:"Monday",tuesday:"Tuesday",wednesday:"Wednesday",thursday:"Thursday",friday:"Friday",saturday:"Saturday",sunday:"Sunday" };

const SLOT_DURATIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

// Generate time options from 00:00 to 23:30 in 15-min steps
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, "0");
  const m = ((i % 4) * 15).toString().padStart(2, "0");
  return `${h}:${m}`;
});

function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60).toString().padStart(2,"0")}:${(total % 60).toString().padStart(2,"0")}`;
}

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${m.toString().padStart(2,"0")} ${ampm}`;
}

// Get next 60 days for the block-date calendar
function getNext60Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

const defaultWeekly = () =>
  DAYS.reduce((acc, d) => ({ ...acc, [d]: { enabled: false, slots: [] } }), {});

export default function Schedule() {
  // ── All original state preserved ──
  const [tab, setTab] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [slotDuration, setSlotDuration] = useState(30);
  const [weekly,       setWeekly]       = useState(defaultWeekly());
  const [blockedDates, setBlockedDates] = useState([]);
  const [activeDay,    setActiveDay]    = useState("monday");
  const [calDates]  = useState(getNext60Days());

  // ── Load (original logic) ──
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BASE}/api/v1/availability/mine`, { withCredentials: true });
        const avail = data.availability;
        setSlotDuration(avail.slotDuration || 30);
        setBlockedDates(avail.blockedDates || []);
        if (avail.weeklySchedule) setWeekly(avail.weeklySchedule);
      } catch { toast.error("Failed to load schedule"); }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Helpers (all original) ──
  const toggleDay = (day) => {
    setWeekly(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  };

  const addSlot = useCallback((day) => {
    setWeekly(prev => {
      const existing = prev[day].slots;
      const lastEnd = existing.length ? existing[existing.length - 1].end : "09:00";
      const start = existing.length ? lastEnd : "09:00";
      const end   = addMinutes(start, slotDuration);
      return { ...prev, [day]: { ...prev[day], slots: [...existing, { start, end }] } };
    });
  }, [slotDuration]);

  const removeSlot = (day, idx) => {
    setWeekly(prev => ({ ...prev, [day]: { ...prev[day], slots: prev[day].slots.filter((_, i) => i !== idx) } }));
  };

  const updateSlot = (day, idx, field, value) => {
    setWeekly(prev => {
      const slots = prev[day].slots.map((s, i) => {
        if (i !== idx) return s;
        const updated = { ...s, [field]: value };
        if (field === "start") updated.end = addMinutes(value, slotDuration);
        return updated;
      });
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const toggleBlockDate = (date) => {
    setBlockedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  // ── Save (original logic) ──
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${BASE}/api/v1/availability/set`, { weeklySchedule: weekly, blockedDates, slotDuration }, { withCredentials: true });
      toast.success("Schedule saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  // ── Active day data (original) ──
  const dayData = weekly[activeDay] || { enabled: false, slots: [] };
  const enabledCount = DAYS.filter(d => weekly[d]?.enabled).length;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f8fafc", fontFamily:"'Inter',sans-serif", flexDirection:"column", gap:12 }}>
      <div style={{ width:36, height:36, border:"3px solid #e2e8f0", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:"#64748b", fontSize:13.5 }}>Loading schedule…</span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');
        @keyframes sc-fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sc-spin   { to{transform:rotate(360deg)} }

        .sc { padding:32px 36px; background:#f8fafc; min-height:100vh; font-family:'Inter',sans-serif; }

        /* ── Header ── */
        .sc-head {
          display:flex; align-items:flex-end; justify-content:space-between;
          margin-bottom:26px; flex-wrap:wrap; gap:14px;
          animation:sc-fadeUp .4s ease both;
        }
        .sc-title { font-family:'Sora',sans-serif; font-size:26px; font-weight:800; color:#0f172a; letter-spacing:-.5px; }
        .sc-sub   { font-size:13px; color:#64748b; margin-top:3px; }

        /* ── Save button ── */
        .sc-save {
          display:flex; align-items:center; gap:8px;
          padding:11px 26px; border-radius:11px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff;
          font-family:'Inter',sans-serif; font-size:13.5px; font-weight:700;
          box-shadow:0 4px 14px rgba(59,130,246,.28); transition:all .2s;
        }
        .sc-save:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(59,130,246,.36); }
        .sc-save:disabled { opacity:.5; cursor:not-allowed; transform:none; }

        /* ── Stats bar ── */
        .sc-stats { display:flex; gap:11px; margin-bottom:20px; animation:sc-fadeUp .4s .03s ease both; flex-wrap:wrap; }
        .sc-stat {
          background:#fff; border:1px solid #e8edf3; border-radius:12px;
          padding:12px 18px; display:flex; flex-direction:column; gap:2px;
          box-shadow:0 1px 4px rgba(15,23,42,.04); transition:all .2s;
        }
        .sc-stat:hover { border-color:#dbeafe; transform:translateY(-2px); }
        .sc-stat-val { font-size:22px; font-weight:800; color:#0f172a; font-family:'Sora',sans-serif; }
        .sc-stat-key { font-size:10.5px; color:#64748b; font-weight:600; letter-spacing:.5px; text-transform:uppercase; }

        /* ── Tab switcher ── */
        .sc-tabs {
          display:flex; gap:3px; margin-bottom:18px;
          background:#f1f5f9; padding:4px; border-radius:11px;
          width:fit-content; animation:sc-fadeUp .4s .07s ease both;
        }
        .sc-tab {
          padding:8px 22px; border-radius:8px;
          font-size:13px; font-weight:600; cursor:pointer; transition:all .18s;
          border:none; background:transparent;
          font-family:'Inter',sans-serif; color:#64748b;
        }
        .sc-tab.on { background:#fff; color:#0f172a; box-shadow:0 1px 4px rgba(15,23,42,.08); }

        /* ── Duration selector ── */
        .sc-dur-row { display:flex; align-items:center; gap:8px; margin-bottom:20px; animation:sc-fadeUp .4s .05s ease both; flex-wrap:wrap; }
        .sc-dur-label { font-size:13px; font-weight:600; color:#0f172a; }
        .sc-dur-btn {
          padding:6px 15px; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff;
          font-family:'Inter',sans-serif; font-size:12px; font-weight:600;
          cursor:pointer; color:#475569; transition:all .18s;
        }
        .sc-dur-btn.on { background:#1d4ed8; color:#fff; border-color:#1d4ed8; }
        .sc-dur-btn:hover:not(.on) { background:#f8fafc; border-color:#cbd5e1; }

        /* ── Layout ── */
        .sc-layout { display:grid; grid-template-columns:210px 1fr; gap:18px; animation:sc-fadeUp .4s .1s ease both; }

        /* ── Day picker ── */
        .sc-days { display:flex; flex-direction:column; gap:5px; }
        .sc-day-btn {
          display:flex; align-items:center; justify-content:space-between;
          padding:11px 14px; border-radius:11px; border:1.5px solid #e8edf3;
          background:#fff; cursor:pointer; transition:all .18s; font-family:'Inter',sans-serif;
          box-shadow:0 1px 3px rgba(15,23,42,.04);
        }
        .sc-day-btn:hover { border-color:#bfdbfe; background:#fafcff; }
        .sc-day-btn.active { background:#1e293b; border-color:#1e293b; }
        .sc-day-name { font-size:13px; font-weight:600; color:#0f172a; }
        .sc-day-btn.active .sc-day-name { color:#f0f7ff; }
        .sc-day-slots { font-size:10.5px; color:#64748b; margin-top:2px; }
        .sc-day-btn.active .sc-day-slots { color:rgba(255,255,255,.4); }
        .sc-day-toggle {
          width:34px; height:18px; border-radius:9px; position:relative;
          flex-shrink:0; cursor:pointer; border:none; background:#e2e8f0; transition:background .2s;
        }
        .sc-day-toggle.on { background:#3b82f6; }
        .sc-day-toggle::after {
          content:''; position:absolute; top:2px; left:2px;
          width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .2s;
        }
        .sc-day-toggle.on::after { transform:translateX(16px); }

        /* ── Slots panel ── */
        .sc-panel { background:#fff; border:1px solid #e8edf3; border-radius:14px; padding:22px; box-shadow:0 1px 4px rgba(15,23,42,.04); }
        .sc-panel-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .sc-panel-title { font-size:17px; font-weight:700; color:#0f172a; font-family:'Sora',sans-serif; }
        .sc-panel-sub { font-size:11.5px; color:#64748b; margin-top:2px; }
        .sc-add-btn {
          display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:9px;
          border:none; background:#f0fdf4; color:#15803d;
          font-family:'Inter',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all .18s;
        }
        .sc-add-btn:hover { background:#dcfce7; }
        .sc-add-btn:disabled { opacity:.4; cursor:not-allowed; }

        /* ── Disabled notice ── */
        .sc-disabled-notice {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:50px 20px; color:#94a3b8; text-align:center; gap:11px;
        }

        /* ── Slot row ── */
        .sc-slot-row {
          display:flex; align-items:center; gap:10px;
          padding:11px 14px; background:#f8fafc;
          border:1.5px solid #e8edf3; border-radius:11px; margin-bottom:9px;
          transition:border-color .18s;
        }
        .sc-slot-row:hover { border-color:#bfdbfe; }
        .sc-slot-label { font-size:10.5px; font-weight:700; color:#64748b; letter-spacing:.4px; min-width:34px; }
        .sc-time-sel {
          padding:7px 11px; border:1.5px solid #e2e8f0; border-radius:8px;
          font-size:13px; font-family:'Inter',sans-serif; color:#0f172a;
          background:#fff; outline:none; cursor:pointer; transition:border-color .18s;
        }
        .sc-time-sel:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.1); }
        .sc-slot-display { font-size:11.5px; color:#64748b; font-weight:600; margin-left:auto; white-space:nowrap; display:flex; align-items:center; gap:5px; }
        .sc-slot-del {
          background:#fef2f2; border:1px solid #fecaca; border-radius:8px;
          padding:6px 9px; color:#ef4444; cursor:pointer; font-size:12px; transition:all .18s;
        }
        .sc-slot-del:hover { background:#fee2e2; }

        .sc-no-slots { text-align:center; padding:36px; color:#94a3b8; font-size:13px; }

        /* ── Calendar ── */
        .sc-cal-wrap { background:#fff; border:1px solid #e8edf3; border-radius:14px; padding:22px; animation:sc-fadeUp .4s .1s ease both; box-shadow:0 1px 4px rgba(15,23,42,.04); }
        .sc-cal-title { font-size:17px; font-weight:700; color:#0f172a; font-family:'Sora',sans-serif; margin-bottom:5px; }
        .sc-cal-sub   { font-size:12px; color:#64748b; margin-bottom:18px; }
        .sc-cal-grid  { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }
        .sc-cal-hdr   { font-size:9.5px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:1px; text-transform:uppercase; padding-bottom:7px; }
        .sc-cal-day {
          aspect-ratio:1; border-radius:8px; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          font-size:12px; font-weight:600; cursor:pointer;
          border:1.5px solid transparent; transition:all .18s; position:relative;
          background:#f8fafc; color:#334155;
        }
        .sc-cal-day:hover { border-color:#93c5fd; background:#eff6ff; color:#1d4ed8; }
        .sc-cal-day.today { border-color:#3b82f6; color:#1d4ed8; background:#eff6ff; }
        .sc-cal-day.blocked { background:#fef2f2; border-color:#fecaca; color:#ef4444; }
        .sc-cal-day.blocked:hover { background:#fee2e2; border-color:#fca5a5; }
        .sc-cal-day-num { font-size:13px; font-weight:700; line-height:1; }
        .sc-cal-day-mo  { font-size:8.5px; color:#94a3b8; margin-top:1px; }
        .sc-cal-day.blocked .sc-cal-day-mo { color:#fca5a5; }

        .sc-blocked-list { margin-top:18px; }
        .sc-blocked-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; margin-bottom:7px; }
        .sc-blocked-date { font-size:13px; font-weight:600; color:#991b1b; display:flex; align-items:center; gap:7px; }
        .sc-unblock-btn { background:none; border:none; cursor:pointer; color:#ef4444; font-size:13px; font-weight:700; display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:7px; transition:background .18s; font-family:'Inter',sans-serif; }
        .sc-unblock-btn:hover { background:#fee2e2; }

        @media(max-width:768px) {
          .sc { padding:20px 16px; }
          .sc-layout { grid-template-columns:1fr; }
          .sc-days { display:grid; grid-template-columns:repeat(4,1fr); }
        }
      `}</style>

      <div className="sc">

        {/* ── Header ── */}
        <div className="sc-head">
          <div>
            <div className="sc-title">My Schedule</div>
            <div className="sc-sub">Set your weekly availability and block specific dates</div>
          </div>
          <button className="sc-save" onClick={handleSave} disabled={saving}>
            <FaSave />
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="sc-stats">
          <div className="sc-stat">
            <div className="sc-stat-val">{enabledCount}</div>
            <div className="sc-stat-key">Active Days</div>
          </div>
          <div className="sc-stat">
            <div className="sc-stat-val">{DAYS.reduce((s,d) => s + (weekly[d]?.slots?.length || 0), 0)}</div>
            <div className="sc-stat-key">Total Slots / Week</div>
          </div>
          <div className="sc-stat">
            <div className="sc-stat-val">{blockedDates.length}</div>
            <div className="sc-stat-key">Blocked Dates</div>
          </div>
          <div className="sc-stat">
            <div className="sc-stat-val">{slotDuration}m</div>
            <div className="sc-stat-key">Slot Duration</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="sc-tabs">
          <button className={`sc-tab ${tab==="weekly"?"on":""}`} onClick={() => setTab("weekly")}>
            📅 Weekly Schedule
          </button>
          <button className={`sc-tab ${tab==="blocked"?"on":""}`} onClick={() => setTab("blocked")}>
            🚫 Block Dates {blockedDates.length > 0 && `(${blockedDates.length})`}
          </button>
        </div>

        {/* ──── WEEKLY TAB ──── */}
        {tab === "weekly" && (
          <>
            {/* Duration */}
            <div className="sc-dur-row">
              <span className="sc-dur-label">Slot Duration:</span>
              {SLOT_DURATIONS.map(d => (
                <button key={d.value} className={`sc-dur-btn ${slotDuration===d.value?"on":""}`} onClick={() => setSlotDuration(d.value)}>
                  {d.label}
                </button>
              ))}
            </div>

            <div className="sc-layout">
              {/* Day picker */}
              <div className="sc-days">
                {DAYS.map(day => {
                  const d = weekly[day] || { enabled: false, slots: [] };
                  return (
                    <div key={day} className={`sc-day-btn ${activeDay===day?"active":""}`} onClick={() => setActiveDay(day)}>
                      <div>
                        <div className="sc-day-name">{DAY_FULL[day]}</div>
                        <div className="sc-day-slots">{d.enabled ? `${d.slots.length} slot${d.slots.length!==1?"s":""}` : "Off"}</div>
                      </div>
                      <button
                        className={`sc-day-toggle ${d.enabled?"on":""}`}
                        onClick={e => { e.stopPropagation(); toggleDay(day); }}
                        title={d.enabled ? "Disable" : "Enable"}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Slots panel */}
              <div className="sc-panel">
                <div className="sc-panel-head">
                  <div>
                    <div className="sc-panel-title">{DAY_FULL[activeDay]}</div>
                    <div className="sc-panel-sub">
                      {dayData.enabled
                        ? `${dayData.slots.length} time slot${dayData.slots.length!==1?"s":""} configured`
                        : "Day is disabled — toggle to add slots"}
                    </div>
                  </div>
                  <button className="sc-add-btn" onClick={() => addSlot(activeDay)} disabled={!dayData.enabled}>
                    <FaPlus /> Add Slot
                  </button>
                </div>

                {!dayData.enabled ? (
                  <div className="sc-disabled-notice">
                    <FaCalendarTimes style={{ fontSize:38, opacity:.25 }} />
                    <div style={{ fontWeight:700, color:"#64748b" }}>Day is off</div>
                    <div style={{ fontSize:12 }}>Toggle the switch to enable {DAY_FULL[activeDay]}</div>
                  </div>
                ) : dayData.slots.length === 0 ? (
                  <div className="sc-no-slots">No slots yet — click <strong>Add Slot</strong> to get started</div>
                ) : (
                  dayData.slots.map((slot, idx) => (
                    <div className="sc-slot-row" key={idx}>
                      <span className="sc-slot-label">#{idx + 1}</span>
                      <span className="sc-slot-label">From</span>
                      <select className="sc-time-sel" value={slot.start} onChange={e => updateSlot(activeDay, idx, "start", e.target.value)}>
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
                      </select>
                      <span className="sc-slot-label">To</span>
                      <select className="sc-time-sel" value={slot.end} onChange={e => updateSlot(activeDay, idx, "end", e.target.value)}>
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
                      </select>
                      <span className="sc-slot-display">
                        <FaClock style={{ opacity:.4 }} />
                        {formatTime12(slot.start)} – {formatTime12(slot.end)}
                      </span>
                      <button className="sc-slot-del" onClick={() => removeSlot(activeDay, idx)} title="Remove"><FaTrash /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* BLOCKED DATES TAB  */}
        {tab === "blocked" && (
          <div className="sc-cal-wrap">
            <div className="sc-cal-title">Block Specific Dates</div>
            <div className="sc-cal-sub">Click a date to block/unblock it. Blocked dates show as unavailable to patients.</div>

            {/* Calendar headers */}
            <div className="sc-cal-grid" style={{ marginBottom: 4 }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="sc-cal-hdr">{d}</div>
              ))}
            </div>

            {/* Calendar days with offset */}
            {(() => {
              const firstDay = new Date(calDates[0]).getDay();
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} />);
              calDates.forEach(date => {
                const d = new Date(date);
                const isBlocked = blockedDates.includes(date);
                const isToday   = date === new Date().toISOString().split("T")[0];
                cells.push(
                  <div
                    key={date}
                    className={`sc-cal-day ${isBlocked?"blocked":""} ${isToday?"today":""}`}
                    onClick={() => toggleBlockDate(date)}
                    title={isBlocked ? "Click to unblock" : "Click to block"}
                  >
                    <span className="sc-cal-day-num">{d.getDate()}</span>
                    <span className="sc-cal-day-mo">{d.toLocaleString("default",{month:"short"})}</span>
                    {isBlocked && <FaLock style={{ fontSize:7, marginTop:1, opacity:.7 }} />}
                  </div>
                );
              });
              return <div className="sc-cal-grid">{cells}</div>;
            })()}

            {/* Blocked list */}
            {blockedDates.length > 0 && (
              <div className="sc-blocked-list">
                <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:10, marginTop:18 }}>
                  🚫 {blockedDates.length} blocked date{blockedDates.length!==1?"s":""}
                </div>
                {[...blockedDates].sort().map(date => (
                  <div key={date} className="sc-blocked-item">
                    <span className="sc-blocked-date">
                      <FaLock style={{ fontSize:11 }} />
                      {new Date(date).toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
                    </span>
                    <button className="sc-unblock-btn" onClick={() => toggleBlockDate(date)}>
                      <FaUnlock /> Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
