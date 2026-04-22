import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaClock, FaLock } from "react-icons/fa";

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function DocSlotPicker({ doctorId, date, onSelect, selected }) {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }

    setLoading(true);
    setSlots([]);
    setBlocked(false);
    setError(false);

    // ✅ Calls real backend — returns slots based on actual DB bookings
    axios
      .get(`${BASE}/api/v1/availability/slots`, {
        params: { doctorId, date },
        withCredentials: true,
      })
      .then(({ data }) => {
        setBlocked(data.blocked || false);
        setSlots(data.slots || []);
      })
      .catch(() => {
        setError(true);
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  if (!doctorId || !date) return null;

  const availableCount = slots.filter(s => s.available).length;

  return (
    <>
      <style>{`
        .dsp { margin-top: 4px; }
        .dsp-header {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 12px;
        }
        .dsp-label {
          font-size: 12px; font-weight: 700; letter-spacing: .8px;
          text-transform: uppercase; color: #6b8f7a;
          display: flex; align-items: center; gap: 6px;
        }
        .dsp-count {
          font-size: 11px; font-weight: 600; color: #1a5c3a;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          padding: 3px 10px; border-radius: 999px;
        }
        .dsp-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .dsp-slot {
          padding: 9px 16px; border-radius: 10px;
          border: 1.5px solid #e4ede8; background: #fff;
          font-size: 13px; font-weight: 600; color: #0f1f15;
          cursor: pointer; transition: all .18s;
          display: flex; align-items: center; gap: 6px;
          font-family: inherit;
        }
        .dsp-slot:hover:not(.taken):not(.selected) {
          border-color: #1a5c3a; background: #f0fdf4;
        }
        .dsp-slot.selected {
          background: #1a5c3a; color: #fff; border-color: #1a5c3a;
        }
        .dsp-slot.taken {
          background: #f9fafb; color: #c4c4c4;
          border-color: #f0f0f0; cursor: not-allowed;
          text-decoration: line-through; opacity: 0.55;
          filter: blur(0.4px);
        }
        .dsp-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e; flex-shrink: 0;
        }
        .dsp-slot.selected .dsp-dot { background: #fff; }
        .dsp-slot.taken    .dsp-dot { background: #d1d5db; }
        .dsp-blocked {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; background: #fef2f2;
          border: 1px solid #fecaca; border-radius: 10px;
          font-size: 13px; font-weight: 600; color: #991b1b;
        }
        .dsp-empty {
          font-size: 13px; color: #a8c4b4; padding: 10px 0;
        }
        .dsp-error {
          font-size: 13px; color: #b45309; padding: 10px 14px;
          background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
        }
        .dsp-loading {
          font-size: 13px; color: #6b8f7a; padding: 10px 0;
          display: flex; align-items: center; gap: 8px;
        }
        .dsp-spinner {
          width: 16px; height: 16px;
          border: 2px solid #e4ede8; border-top-color: #1a5c3a;
          border-radius: 50%; animation: dspin .8s linear infinite;
        }
        .dsp-selected-badge {
          margin-top: 12px; padding: 8px 14px; border-radius: 8px;
          background: rgba(26,61,46,.08); border: 1px solid rgba(26,61,46,.2);
          font-size: 13px; font-weight: 700; color: #1a3d2e;
        }
        @keyframes dspin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dsp">
        <div className="dsp-header">
          <div className="dsp-label">
            <FaClock /> Available Time Slots
          </div>
          {!loading && !blocked && !error && slots.length > 0 && (
            <div className="dsp-count">{availableCount} slots open</div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="dsp-loading">
            <div className="dsp-spinner" /> Checking availability…
          </div>
        )}

        {/* Network error */}
        {!loading && error && (
          <div className="dsp-error">
            ⚠️ Could not load slots. Please try again.
          </div>
        )}

        {/* Doctor blocked this date */}
        {!loading && !error && blocked && (
          <div className="dsp-blocked">
            <FaLock /> Doctor is unavailable on this date.
          </div>
        )}

        {/* Sunday / no slots */}
        {!loading && !error && !blocked && slots.length === 0 && (
          <div className="dsp-empty">
            No slots available for this date.
          </div>
        )}

        {/* ✅ Real slots from DB — available = bookable, taken = greyed/blurred */}
        {!loading && !error && !blocked && slots.length > 0 && (
          <div className="dsp-grid">
            {slots.map(slot => {
              const isTaken    = !slot.available;
              const isSelected = selected === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  className={`dsp-slot ${isTaken ? "taken" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => !isTaken && onSelect(slot.start)}
                  disabled={isTaken}
                  title={isTaken ? "Already booked" : `Book ${formatTime12(slot.start)}`}
                >
                  <span className="dsp-dot" />
                  {formatTime12(slot.start)}
                  {isTaken && <FaLock style={{ fontSize: 9 }} />}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected slot confirmation */}
        {selected && (
          <div className="dsp-selected-badge">
            ✅ Selected: {formatTime12(selected)}
          </div>
        )}
      </div>
    </>
  );
}
