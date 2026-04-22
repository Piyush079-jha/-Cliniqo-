
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaClock, FaLock } from "react-icons/fa";

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${m.toString().padStart(2,"0")} ${ampm}`;
}

export default function DoctorSlotPicker({ doctorId, date, onSelect, selected }) {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!doctorId || !date) { setSlots([]); return; }

    setLoading(true);
    setSlots([]);
    setBlocked(false);

    axios
      .get(`${BASE}/api/v1/availability/slots`, { params: { doctorId, date }, withCredentials: true })
      .then(({ data }) => {
        setBlocked(data.blocked);
        setSlots(data.slots || []);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  if (!doctorId || !date) return null;

  return (
    <>
      <style>{`
        .dsp { margin-top: 16px; }
        .dsp-label {
          font-size: 12px; font-weight: 700; letter-spacing: .8px;
          text-transform: uppercase; color: #6b8f7a; margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px;
        }
        .dsp-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .dsp-slot {
          padding: 9px 16px; border-radius: 10px; border: 1.5px solid #e4ede8;
          background: #fff; font-size: 13px; font-weight: 600; color: #0f1f15;
          cursor: pointer; transition: all .18s; display: flex; align-items: center; gap: 6px;
          font-family: inherit;
        }
        .dsp-slot:hover:not(.taken):not(.selected) { border-color: #1a5c3a; background: #f0fdf4; }
        .dsp-slot.selected { background: #1a5c3a; color: #fff; border-color: #1a5c3a; }
        .dsp-slot.taken {
          background: #f9fafb; color: #d1d5db; border-color: #f3f4f6;
          cursor: not-allowed; text-decoration: line-through;
        }
        .dsp-empty { font-size: 13px; color: #a8c4b4; padding: 12px 0; }
        .dsp-blocked {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; font-size: 13px; font-weight: 600; color: #991b1b;
        }
        .dsp-loading { font-size: 13px; color: #6b8f7a; padding: 10px 0; display:flex; align-items:center; gap:8px; }
        .dsp-spinner { width:16px; height:16px; border:2px solid #e4ede8; border-top-color:#1a5c3a; border-radius:50%; animation:dspin .8s linear infinite; }
        @keyframes dspin { to { transform:rotate(360deg) } }
      `}</style>

      <div className="dsp">
        <div className="dsp-label">
          <FaClock /> Available Time Slots
        </div>

        {loading && (
          <div className="dsp-loading">
            <div className="dsp-spinner" /> Checking availability…
          </div>
        )}

        {!loading && blocked && (
          <div className="dsp-blocked">
            <FaLock /> Doctor is unavailable on this date
          </div>
        )}

        {!loading && !blocked && slots.length === 0 && (
          <div className="dsp-empty">No slots available for this date.</div>
        )}

        {!loading && !blocked && slots.length > 0 && (
          <div className="dsp-grid">
            {slots.map(slot => (
              <button
                key={slot.start}
                type="button"
                className={`dsp-slot ${!slot.available?"taken":""} ${selected===slot.start?"selected":""}`}
                onClick={() => slot.available && onSelect(slot.start)}
                disabled={!slot.available}
                title={slot.available ? `Book ${formatTime12(slot.start)}` : "Already booked"}
              >
                {!slot.available && <FaLock style={{ fontSize:10 }} />}
                {formatTime12(slot.start)}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
