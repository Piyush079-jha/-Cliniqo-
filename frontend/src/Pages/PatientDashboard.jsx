import React, { useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../main";
import { jsPDF } from "jspdf"; // ← PDF generator

const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com/api/v1/user/login";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_META = {
  Pending:   { bg: "#fffbeb", color: "#92400e", border: "#fde68a", dot: "#f59e0b", icon: "⏳", label: "Pending"   },
  Accepted:  { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7", dot: "#10b981", icon: "✅", label: "Accepted"  },
  Rejected:  { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", dot: "#ef4444", icon: "❌", label: "Rejected"  },
  Confirmed: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", dot: "#3b82f6", icon: "📋", label: "Confirmed" },
  Completed: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", dot: "#22c55e", icon: "🎉", label: "Completed" },
  Cancelled: { bg: "#f9fafb", color: "#374151", border: "#d1d5db", dot: "#9ca3af", icon: "🚫", label: "Cancelled" },
};

const IconHome   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconEyeOff = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconEye    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconCal    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconClk    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconBell   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;

// ─────────────────────────────────────────────────────────────────────────────
// Generate and download prescription as a real PDF file using jsPDF
// ─────────────────────────────────────────────────────────────────────────────
const downloadPrescriptionPDF = (rx, patientName) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0; // current vertical position on the page

  // ── Header background (dark green bar at top) ─────────────────────────────
  doc.setFillColor(10, 31, 20);
  doc.rect(0, 0, pageW, 42, "F");

  // ── Cliniqo logo text ─────────────────────────────────────────────────────
  doc.setTextColor(201, 168, 76); // gold color
  doc.setFontSize(26);
  doc.setFont("helvetica", "bolditalic");
  doc.text("Cliniqo", margin, 18);

  // ── Tagline ───────────────────────────────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Your Trusted Healthcare Partner", margin, 26);

  // ── "PRESCRIPTION" label on right side of header ─────────────────────────
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PRESCRIPTION", pageW - margin, 18, { align: "right" });

  // ── Date on right side ────────────────────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${fmtDate(rx.createdAt)}`, pageW - margin, 26, { align: "right" });

  y = 52;

  // ── Doctor and Patient info side by side ──────────────────────────────────
  doc.setFillColor(240, 244, 248);
  doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "F");

  // Doctor info (left side)
  doc.setTextColor(107, 143, 160);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("DOCTOR", margin + 8, y + 8);
  doc.setTextColor(15, 31, 34);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const doctorName = rx.doctorName ? `Dr. ${rx.doctorName}` : `Dr. ${rx.doctor?.firstName || ""} ${rx.doctor?.lastName || ""}`;
  doc.text(doctorName, margin + 8, y + 17);
  if (rx.doctorDepartment) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 143, 160);
    doc.text(rx.doctorDepartment, margin + 8, y + 23);
  }

  // Patient info (right side)
  doc.setTextColor(107, 143, 160);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT", pageW / 2 + 4, y + 8);
  doc.setTextColor(15, 31, 34);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(patientName || "Patient", pageW / 2 + 4, y + 17);

  // Vertical divider line between doctor and patient
  doc.setDrawColor(220, 228, 235);
  doc.line(pageW / 2, y + 4, pageW / 2, y + 24);

  y += 36;

  // ── Diagnosis section ─────────────────────────────────────────────────────
  if (rx.diagnosis) {
    doc.setFillColor(236, 253, 245); // light green background
    doc.roundedRect(margin, y, pageW - margin * 2, 18, 3, 3, "F");
    doc.setDrawColor(110, 231, 183);
    doc.roundedRect(margin, y, pageW - margin * 2, 18, 3, 3, "S");

    doc.setTextColor(6, 95, 70);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNOSIS", margin + 8, y + 7);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(rx.diagnosis, margin + 8, y + 14);
    y += 26;
  }

  // ── Medications section ───────────────────────────────────────────────────
  const drugs = rx.drugs || [];

  // Section title
  doc.setTextColor(10, 31, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("💊  Medications", margin, y + 6);
  y += 12;

  // Table header row
  doc.setFillColor(10, 31, 20);
  doc.roundedRect(margin, y, pageW - margin * 2, 9, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  // Column headers
  const col1 = margin + 4;
  const col2 = margin + 72;
  const col3 = margin + 110;
  const col4 = margin + 142;

  doc.text("Medicine Name", col1, y + 6);
  doc.text("Dosage", col2, y + 6);
  doc.text("Frequency", col3, y + 6);
  doc.text("Duration", col4, y + 6);
  y += 10;

  // Medication rows — alternating background colors for readability
  drugs.forEach((drug, index) => {
    const rowBg = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
    doc.setFillColor(...rowBg);
    doc.rect(margin, y, pageW - margin * 2, 9, "F");

    doc.setTextColor(15, 31, 34);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(drug.name || "—", col1, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 122, 138);
    doc.text(drug.dose || "—", col2, y + 6);
    doc.text(drug.frequency || "—", col3, y + 6);
    doc.text(drug.duration || "—", col4, y + 6);

    // Light border between rows
    doc.setDrawColor(228, 237, 245);
    doc.line(margin, y + 9, pageW - margin, y + 9);

    y += 9;
  });

  // Border around the entire medications table
  doc.setDrawColor(228, 237, 245);
  doc.roundedRect(margin, y - drugs.length * 9 - 10, pageW - margin * 2, drugs.length * 9 + 10, 2, 2, "S");

  y += 10;

  // ── Doctor's notes section ────────────────────────────────────────────────
  if (rx.notes) {
    doc.setFillColor(255, 251, 235); // light yellow background
    doc.roundedRect(margin, y, pageW - margin * 2, 26, 3, 3, "F");
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin, y, pageW - margin * 2, 26, 3, 3, "S");

    doc.setTextColor(146, 64, 14);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("📝  NOTES & INSTRUCTIONS", margin + 8, y + 8);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Split long notes into multiple lines automatically
    const noteLines = doc.splitTextToSize(rx.notes, pageW - margin * 2 - 16);
    doc.text(noteLines, margin + 8, y + 16);
    y += 34;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 20;

  // Divider line above footer
  doc.setDrawColor(228, 237, 245);
  doc.line(margin, footerY - 6, pageW - margin, footerY - 6);

  // Footer text
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("This prescription was generated digitally by Cliniqo — Your Trusted Healthcare Partner", pageW / 2, footerY, { align: "center" });
  doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageW / 2, footerY + 5, { align: "center" });

  // ── Save the PDF file ─────────────────────────────────────────────────────
  const fileName = `Prescription_${(patientName || "Patient").replace(/\s+/g, "_")}_${fmtDate(rx.createdAt).replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};

// ─────────────────────────────────────────────────────────────────────────────
// Prescription Detail Modal — shows full prescription before downloading
// ─────────────────────────────────────────────────────────────────────────────
const PrescriptionModal = ({ rx, patientName, onClose }) => {
  if (!rx) return null;

  const doctorName = rx.doctorName
    ? `Dr. ${rx.doctorName}`
    : `Dr. ${rx.doctor?.firstName || ""} ${rx.doctor?.lastName || ""}`;
  const drugs = rx.drugs || [];

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: 20,
        animation: "pd-in .2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20,
          maxWidth: 560, width: "100%",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,.25)",
          animation: "pd-in .25s cubic-bezier(.22,1,.36,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header — dark green like the rest of the app */}
        <div style={{
          padding: "22px 26px",
          background: "linear-gradient(135deg, #0a1f14, #133d22)",
          borderRadius: "20px 20px 0 0",
          position: "relative", overflow: "hidden",
        }}>
          {/* Gold shimmer line at top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
          }}/>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "#fff", fontWeight: 700 }}>
                💊 Prescription
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 3 }}>
                {fmtDate(rx.createdAt)}
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
                color: "#fff", width: 32, height: 32, borderRadius: "50%",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, transition: "all .18s",
              }}
            >✕</button>
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: "22px 26px" }}>

          {/* Doctor and Patient info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {/* Doctor card */}
            <div style={{
              background: "#f0f9f4", border: "1px solid #bbf7d0",
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b8fa0", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Doctor</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1f22" }}>{doctorName}</div>
            </div>
            {/* Patient card */}
            <div style={{
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b8fa0", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Patient</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1f22" }}>{patientName || "—"}</div>
            </div>
          </div>

          {/* Diagnosis */}
          {rx.diagnosis && (
            <div style={{
              background: "#ecfdf5", border: "1px solid #6ee7b7",
              borderRadius: 10, padding: "12px 16px", marginBottom: 18,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Diagnosis</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1f22" }}>{rx.diagnosis}</div>
            </div>
          )}

          {/* Medications table */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a3d2e", marginBottom: 10 }}>💊 Medications</div>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr",
              background: "#0a1f14", borderRadius: "8px 8px 0 0",
              padding: "8px 12px",
            }}>
              {["Medicine", "Dose", "Frequency", "Duration"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</div>
              ))}
            </div>

            {/* Medication rows */}
            {drugs.map((drug, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr",
                padding: "10px 12px",
                background: i % 2 === 0 ? "#f8fafc" : "#fff",
                borderBottom: "1px solid #e4edf5",
                borderLeft: "1px solid #e4edf5",
                borderRight: "1px solid #e4edf5",
                borderRadius: i === drugs.length - 1 ? "0 0 8px 8px" : 0,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1f22" }}>{drug.name || "—"}</div>
                <div style={{ fontSize: 12, color: "#5a7a8a" }}>{drug.dose || "—"}</div>
                <div style={{ fontSize: 12, color: "#5a7a8a" }}>{drug.frequency || "—"}</div>
                <div style={{ fontSize: 12, color: "#5a7a8a" }}>{drug.duration || "—"}</div>
              </div>
            ))}

            {drugs.length === 0 && (
              <div style={{ padding: "14px 12px", background: "#f8fafc", borderRadius: "0 0 8px 8px", fontSize: 13, color: "#6b8fa0", border: "1px solid #e4edf5", borderTop: "none" }}>
                No medications listed
              </div>
            )}
          </div>

          {/* Notes */}
          {rx.notes && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 10, padding: "12px 16px", marginBottom: 18,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>📝 Notes & Instructions</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{rx.notes}</div>
            </div>
          )}
        </div>

        {/* Modal footer — action buttons */}
        <div style={{
          padding: "14px 26px 20px",
          borderTop: "1px solid #f0f5f8",
          display: "flex", gap: 10,
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", borderRadius: 10,
              border: "1.5px solid #dce7ee", background: "#fff",
              color: "#5a7a8a", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
              transition: "background .18s",
            }}
          >
            Close
          </button>

          {/* Download PDF button */}
          <button
            onClick={() => {
              downloadPrescriptionPDF(rx, patientName);
            }}
            style={{
              flex: 2, padding: "11px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #1a3d2e, #2d6a4f)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(26,61,46,.25)",
              transition: "all .18s",
            }}
          >
            ⬇️ Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main PatientDashboard component
// ─────────────────────────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const { user, setIsAuthenticated, setUser } = useContext(Context);
  const navigate = useNavigate();

  const [activeTab,     setActiveTab]     = useState("appointments");
  const [appointments,  setAppointments]  = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [videoSessions, setVideoSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // const [showNotifs,    setShowNotifs]    = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [rxLoading,     setRxLoading]     = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filter,        setFilter]        = useState("All");
  const [heroVis,       setHeroVis]       = useState(false);
  const [selectedAppt,  setSelectedAppt]  = useState(null);
  const [delModal,      setDelModal]      = useState({ open: false, id: null, type: null });
  const [hiddenIds,     setHiddenIds]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("pd_hidden") || "[]"); } catch { return []; }
  });
  const [toast, setToast] = useState(null);

  // Track video consultation request status per appointment
  const [videoRequested, setVideoRequested] = useState({});
  const [videoLoading,   setVideoLoading]   = useState({});

  // Which prescription is open in the detail modal
  const [rxModal, setRxModal] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const buildNotifications = useCallback((appts, rxs) => {
    const notifs = [];
    appts.forEach(a => {
      if (a.status === "Accepted") {
        notifs.push({ id: `appt-${a._id}`, type: "appointment", icon: "✅", text: `Your appointment with Dr. ${a.doctor?.firstName} ${a.doctor?.lastName} was accepted.`, time: a.updatedAt });
      }
      if (a.videoCallEnabled && a.status === "Accepted") {
        notifs.push({ id: `vcall-${a._id}`, type: "video", icon: "📹", text: `Video consultation is now available for your appointment with Dr. ${a.doctor?.firstName} ${a.doctor?.lastName}.`, time: a.updatedAt });
      }
    });
    rxs.forEach(rx => {
      notifs.push({ id: `rx-${rx._id}`, type: "prescription", icon: "💊", text: `Dr. ${rx.doctorName || "your doctor"} added a new prescription for you.`, time: rx.createdAt });
    });
    notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
    setNotifications(notifs);
  }, []);

  // Stores { [appointmentId]: { status, roomId, consultationId } }
  const fetchVideoRequests = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${BASE}/api/v1/videoconsult/patient/mine`,
        { withCredentials: true }
      );
      const map = {};
      (data.consultations || []).forEach((c) => {
        if (c.appointmentId) {
          // Keep the most recent / highest-priority status per appointment
          const existing = map[c.appointmentId];
          const priority = ["Active","Ringing","Accepted","Pending","Ended","Completed","Declined","Rejected","Missed"];
          const newPriority = priority.indexOf(c.status);
          const oldPriority = existing ? priority.indexOf(existing.status) : 999;
          if (!existing || newPriority < oldPriority) {
            map[c.appointmentId] = {
              status:         c.status,
              roomId:         c.roomId,
              consultationId: c._id,
            };
          }
        }
      });
      setVideoRequested(map);
    } catch {}
  }, []);

  const toggleHide = (id) => {
    setHiddenIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("pd_hidden", JSON.stringify(next));
      return next;
    });
    showToast(hiddenIds.includes(id) ? "Item restored" : "Item hidden");
  };

  const executeDelete = async () => {
    const { id, type } = delModal;
    setDelModal({ open: false, id: null, type: null });
    try {
      if (type === "prescription") {
        await axios.delete(`${BASE}/api/v1/prescription/delete/${id}`, { withCredentials: true });
        setPrescriptions(prev => prev.filter(p => p._id !== id));
        showToast("Prescription deleted");
      } else if (type === "video") {
        setVideoSessions(prev => prev.filter(v => v._id !== id));
        showToast("Session removed");
      }
    } catch { showToast("Failed to delete", "error"); }
  };

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await axios.get(`${BASE}/api/v1/appointment/patient/mine`, { withCredentials: true });
      const appts = data.appointments || [];
      setAppointments(appts);
      return appts;
    } catch { return []; }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchPrescriptions = useCallback(async () => {
    setRxLoading(true);
    try {
      const { data } = await axios.get(`${BASE}/api/v1/prescription/patient/mine`, { withCredentials: true });
      const rxs = data.prescriptions || [];
      setPrescriptions(rxs);
      return rxs;
    } catch { return []; }
    finally { setRxLoading(false); }
  }, []);

  useEffect(() => {
    const load = async () => {
      const [appts, rxs] = await Promise.all([fetchAppointments(), fetchPrescriptions()]);
      buildNotifications(appts, rxs);
      fetchVideoRequests();
    };
    load();
    setTimeout(() => setHeroVis(true), 80);
    const iv = setInterval(async () => {
      const appts = await fetchAppointments(true);
      const rxs   = await fetchPrescriptions();
      buildNotifications(appts, rxs);
      fetchVideoRequests();
    }, 30_000);
    return () => clearInterval(iv);
  }, [fetchAppointments, fetchPrescriptions, buildNotifications, fetchVideoRequests]);

  useEffect(() => {
    if (activeTab !== "appointments") return;
    const iv = setInterval(fetchVideoRequests, 10_000);
    return () => clearInterval(iv);
  }, [activeTab, fetchVideoRequests]);

  const handleVideoRequest = async (e, appointmentId) => {
    e.stopPropagation();
    setVideoLoading(prev => ({ ...prev, [appointmentId]: true }));
    try {
      await axios.post(`${BASE}/api/v1/videoconsult/request`, { appointmentId }, { withCredentials: true });
      setVideoRequested(prev => ({
        ...prev,
        [appointmentId]: { status: "Pending", roomId: null, consultationId: null },
      }));
      showToast("📹 Video consultation request sent to doctor!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send request", "error");
    } finally {
      setVideoLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${BASE}/api/v1/user/patient/logout`, { withCredentials: true });
      setUser(null); setIsAuthenticated(false); navigate("/");
    } catch { showToast("Logout failed", "error"); }
  };

  const total     = appointments.length;
  const pending   = appointments.filter(a => a.status === "Pending").length;
  const accepted  = appointments.filter(a => a.status === "Accepted").length;
  const completed = appointments.filter(a => a.status === "Completed").length;
  const rejected  = appointments.filter(a => a.status === "Rejected").length;
  const filtered  = filter === "All" ? appointments : appointments.filter(a => a.status === filter);
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const unreadCount = notifications.length;

  const getVideoButtonMeta = (apptId, isLoading) => {
    const vc     = videoRequested[apptId];
    const status = vc?.status || null;
    if (isLoading)                                           return { label: "⏳ Sending…",                   bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc", disabled: true  };
    if (!status)                                             return { label: "📹 Request Video Call",          bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", disabled: false };
    if (status === "Pending")                                return { label: "⏳ Request Sent",                bg: "#fffbeb", color: "#92400e", border: "#fde68a", disabled: true  };
    if (status === "Accepted" || status === "Ringing")       return { label: "🟢 Doctor Ready — Join Call",   bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7", disabled: false };
    if (status === "Active")                                 return { label: "🔴 Call In Progress — Rejoin",  bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", disabled: false };
    if (status === "Rejected" || status === "Declined")      return { label: "❌ Request Declined",            bg: "#fef2f2", color: "#991b1b", border: "#fecaca", disabled: true  };
    if (status === "Missed")                                 return { label: "📵 Call Missed",                bg: "#fffbeb", color: "#92400e", border: "#fde68a", disabled: true  };
    if (status === "Completed" || status === "Ended")        return { label: "✅ Consultation Done",           bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", disabled: true  };
    return { label: "📹 Request Video Call", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", disabled: false };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @keyframes pd-up    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pd-in    { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        @keyframes pd-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes pd-spin  { to{transform:rotate(360deg)} }
        @keyframes pd-slide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pd-shim  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        *,*::before,*::after{box-sizing:border-box}
        .pd{font-family:'Plus Jakarta Sans',sans-serif;background:#f0f4f8;min-height:100vh}
        .pd-top{position:sticky;top:0;z-index:100;background:#0a1f14;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:60px;box-shadow:0 2px 16px rgba(0,0,0,.25)}
        .pd-top-l{display:flex;align-items:center;gap:14px}
        .pd-back{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.15);color:#fff;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;transition:all .18s;text-decoration:none}
        .pd-back:hover{background:rgba(255,255,255,.16);transform:translateX(-2px)}
        .pd-logo{font-family:'Playfair Display',serif;font-size:20px;color:#c9a84c;font-style:italic}
        .pd-top-r{display:flex;align-items:center;gap:10px}
        .pd-chip{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:5px 12px 5px 6px}
        .pd-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8cc80);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#0a1f14}
        .pd-uname{font-size:13px;font-weight:600;color:rgba(255,255,255,.85)}
        .pd-logout{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#fca5a5;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;transition:all .18s}
        .pd-logout:hover{background:rgba(239,68,68,.22)}
        .pd-bell-wrap{position:relative}
        .pd-bell{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7);width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s}
        .pd-bell:hover{background:rgba(255,255,255,.16)}
        .pd-bell-badge{position:absolute;top:-5px;right:-5px;background:#ef4444;color:#fff;border-radius:999px;font-size:9px;font-weight:700;padding:1px 5px;border:2px solid #0a1f14}
        .pd-notif-panel{position:absolute;top:44px;right:0;width:320px;background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);border:1px solid #e4edf5;z-index:200;overflow:hidden;animation:pd-in .18s ease}
        .pd-notif-hd{padding:13px 16px;border-bottom:1px solid #f0f5f8;display:flex;align-items:center;justify-content:space-between}
        .pd-notif-hd strong{font-size:13px;font-weight:700;color:#0f1f22}
        .pd-notif-hd span{font-size:11px;color:#6b8fa0;cursor:pointer}
        .pd-notif-row{display:flex;align-items:flex-start;gap:10px;padding:11px 16px;border-bottom:1px solid #f8fafc;cursor:pointer;transition:background .14s}
        .pd-notif-row:hover{background:#f0fdf4}
        .pd-notif-ico{width:32px;height:32px;border-radius:9px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .pd-notif-txt{font-size:12px;color:#374151;line-height:1.5;flex:1}
        .pd-notif-time{font-size:10px;color:#9ca3af;margin-top:3px}
        .pd-notif-empty{padding:24px 16px;text-align:center;font-size:13px;color:#6b8fa0}
        .pd-hero{background:linear-gradient(135deg,#0a1f14 0%,#133d22 60%,#1a5c35 100%);padding:48px 40px 38px;position:relative;overflow:hidden}
        .pd-hero::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#c9a84c,#f0d980,#c9a84c,transparent)}
        .pd-hgrid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:40px 40px}
        .pd-hinner{position:relative;z-index:1;max-width:1200px;margin:0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:28px;flex-wrap:wrap}
        .pd-htxt{opacity:0}
        .pd-htxt.vis{animation:pd-up .7s cubic-bezier(.22,1,.36,1) forwards}
        .pd-htag{display:inline-flex;align-items:center;gap:7px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.35);color:#c9a84c;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:13px}
        .pd-htag-dot{width:6px;height:6px;border-radius:50%;background:#c9a84c;animation:pd-blink 2s infinite}
        .pd-htxt h1{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,36px);color:#fff;font-weight:700;line-height:1.1;margin:0 0 10px}
        .pd-htxt h1 em{font-style:italic;color:#c9a84c}
        .pd-htxt p{color:rgba(255,255,255,.5);font-size:13.5px;margin:0}
        .pd-stats{display:flex;gap:11px;flex-wrap:wrap;opacity:0}
        .pd-stats.vis{animation:pd-up .7s .1s cubic-bezier(.22,1,.36,1) forwards}
        .pd-stat{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:13px 18px;text-align:center;min-width:76px;transition:background .2s}
        .pd-stat:hover{background:rgba(255,255,255,.12)}
        .pd-sv{font-size:24px;font-weight:800;color:#c9a84c}
        .pd-sl{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1px;margin-top:3px}
        .pd-tabs{background:#fff;border-bottom:1px solid #e4edf5;padding:0 40px;display:flex;gap:4px;position:sticky;top:60px;z-index:90;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow-x:auto}
        .pd-tab{display:flex;align-items:center;gap:7px;padding:15px 18px;font-size:13.5px;font-weight:600;color:#6b7e8f;border:none;background:none;cursor:pointer;position:relative;font-family:'Plus Jakarta Sans',sans-serif;transition:color .18s;border-bottom:2.5px solid transparent;margin-bottom:-1px;white-space:nowrap;flex-shrink:0}
        .pd-tab:hover{color:#1a3d2e}
        .pd-tab.active{color:#1a3d2e;border-bottom-color:#1a3d2e}
        .pd-body{max-width:1200px;margin:0 auto;padding:30px 40px 60px}
        .pd-filter{display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap}
        .pd-fbtn{padding:6px 15px;border-radius:20px;border:1.5px solid #dce7ee;background:#fff;cursor:pointer;font-size:12.5px;font-weight:700;color:#5a7a8a;transition:all .18s;font-family:'Plus Jakarta Sans',sans-serif}
        .pd-fbtn:hover{border-color:#1a3d2e;color:#1a3d2e}
        .pd-fbtn.on{background:#1a3d2e;color:#fff;border-color:#1a3d2e}
        .pd-fc{font-size:10px;opacity:.7;margin-left:3px}
        .pd-ref{margin-left:auto;display:flex;align-items:center;gap:6px;padding:6px 13px;border-radius:20px;border:1.5px solid #dce7ee;background:#fff;cursor:pointer;font-size:12px;font-weight:700;color:#5a7a8a;transition:all .18s;font-family:'Plus Jakarta Sans',sans-serif}
        .pd-ref:hover{border-color:#1a3d2e;color:#1a3d2e}
        .pd-reficon{display:inline-block}
        .pd-reficon.s{animation:pd-spin .7s linear infinite}
        .pd-skel{background:linear-gradient(90deg,#edf2f7 25%,#e2eaf0 50%,#edf2f7 75%);background-size:200% 100%;animation:pd-shim 1.5s infinite;border-radius:14px}
        .pd-empty{background:#fff;border-radius:16px;border:1.5px solid #e4edf5;padding:56px 36px;text-align:center;animation:pd-up .4s ease}
        .pd-ei{font-size:46px;display:block;margin-bottom:13px}
        .pd-empty h3{font-family:'Playfair Display',serif;font-size:21px;color:#1a3d2e;margin:0 0 8px}
        .pd-empty p{font-size:13.5px;color:#6b8fa0;max-width:280px;margin:0 auto 20px;line-height:1.7}
        .pd-cta{display:inline-flex;align-items:center;gap:7px;padding:11px 22px;border-radius:10px;background:linear-gradient(135deg,#1a3d2e,#2d6a4f);color:#fff;font-size:13px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(26,61,46,.2);transition:transform .2s,box-shadow .2s}
        .pd-cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(26,61,46,.3)}
        .pd-alist{display:flex;flex-direction:column;gap:11px}
        .pd-acard{background:#fff;border-radius:15px;border:1.5px solid #e4edf5;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;transition:transform .2s,box-shadow .2s;cursor:pointer;position:relative;animation:pd-up .3s ease both}
        .pd-acard:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.09)}
        .pd-acard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px}
        .pd-acard[data-s="Pending"]::before{background:#f59e0b}
        .pd-acard[data-s="Accepted"]::before{background:#10b981}
        .pd-acard[data-s="Rejected"]::before{background:#ef4444}
        .pd-acard[data-s="Confirmed"]::before{background:#3b82f6}
        .pd-acard[data-s="Completed"]::before{background:#22c55e}
        .pd-acard[data-s="Cancelled"]::before{background:#9ca3af}
        .pd-ainner{display:flex;align-items:center;gap:14px;padding:15px 18px 15px 22px;flex-wrap:wrap}
        .pd-aico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}
        .pd-ainfo{flex:1;min-width:160px}
        .pd-adoc{font-size:14px;font-weight:700;color:#0f1f22;margin-bottom:2px}
        .pd-adept{font-size:12px;color:#6b8fa0;margin-bottom:5px}
        .pd-ameta{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
        .pd-ami{display:flex;align-items:center;gap:4px;font-size:12px;color:#5a7a8a}
        .pd-badge{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;border:1px solid;flex-shrink:0;white-space:nowrap}
        .pd-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .pd-acard[data-s="Pending"] .pd-dot{animation:pd-blink 1.5s infinite}
        .pd-banner{display:flex;align-items:center;gap:10px;padding:8px 22px;border-top:1px solid;font-size:12.5px;font-weight:600}
        .pd-video-btn{display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:9px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;border:1.5px solid;margin:0 18px 12px 22px;width:fit-content}
        .pd-video-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(29,78,216,.15)}
        .pd-video-btn:disabled{cursor:not-allowed;opacity:.75}
        .pd-rxlist{display:flex;flex-direction:column;gap:11px}
        .pd-rxcard{background:#fff;border-radius:15px;border:1.5px solid #e4edf5;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;transition:opacity .3s,filter .3s;animation:pd-up .3s ease both}
        .pd-rxcard.hid{opacity:.38;filter:blur(1.5px)}
        .pd-rxcard.hid:hover{opacity:.6;filter:blur(0)}
        .pd-rxcard.nw{border-color:#bfdbfe;box-shadow:0 0 0 3px rgba(59,130,246,.07)}
        .pd-rxhead{display:flex;align-items:center;gap:13px;padding:15px 18px;border-bottom:1px solid #f0f5f8}
        .pd-rxico{width:42px;height:42px;border-radius:11px;background:#eff6ff;border:1px solid #bfdbfe;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}
        .pd-rxttl{flex:1}
        .pd-rxttl strong{display:block;font-size:14px;font-weight:700;color:#0f1f22;margin-bottom:2px}
        .pd-rxttl span{font-size:12px;color:#6b8fa0}
        .pd-nwbadge{background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:999px}
        .pd-rxbody{padding:13px 18px}
        .pd-meds{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
        .pd-med{background:#f0f9ff;border:1px solid #bae6fd;color:#0369a1;font-size:12px;font-weight:600;padding:3px 9px;border-radius:6px}
        .pd-rnote{font-size:13px;color:#5a7a8a;line-height:1.6;margin:0}
        .pd-acts{display:flex;gap:8px;padding:11px 18px;border-top:1px solid #f0f5f8;flex-wrap:wrap}
        .pd-abtn{display:flex;align-items:center;gap:6px;padding:6px 13px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .18s;border:1.5px solid}
        .pd-abtn.hi{background:#f8fafb;border-color:#dce7ee;color:#5a7a8a}
        .pd-abtn.hi:hover{background:#edf2f7;border-color:#b0c4d0}
        .pd-abtn.dl{background:#fff5f5;border-color:#fecaca;color:#dc2626}
        .pd-abtn.dl:hover{background:#fee2e2}
        .pd-abtn.sh{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
        .pd-abtn.sh:hover{background:#dbeafe}
        .pd-abtn.view{background:#f0fdf4;border-color:#bbf7d0;color:#166534}
        .pd-abtn.view:hover{background:#dcfce7}
        .pd-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;animation:pd-in .2s ease}
        .pd-modal{background:#fff;border-radius:20px;max-width:450px;width:100%;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.2);animation:pd-in .22s cubic-bezier(.22,1,.36,1)}
        .pd-mh{padding:19px 22px;background:#0a1f14;position:relative;overflow:hidden}
        .pd-mh::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#c9a84c,transparent)}
        .pd-mh h3{font-family:'Playfair Display',serif;font-size:19px;color:#fff;margin:0 0 3px}
        .pd-mh p{font-size:12px;color:rgba(255,255,255,.45);margin:0}
        .pd-mb{padding:18px 22px}
        .pd-mr{display:flex;align-items:flex-start;gap:11px;padding:8px 0;border-bottom:1px solid #f0f5f8}
        .pd-mr:last-child{border-bottom:none}
        .pd-mi{width:30px;height:30px;border-radius:9px;background:rgba(26,61,46,.06);border:1px solid rgba(26,61,46,.1);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .pd-mt strong{display:block;font-size:10.5px;font-weight:700;color:#6b8fa0;text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px}
        .pd-mt span{font-size:13px;font-weight:600;color:#0f1f22}
        .pd-mf{padding:13px 22px;border-top:1px solid #f0f5f8;display:flex;gap:10px}
        .pd-mc{flex:1;padding:9px;border-radius:9px;border:1.5px solid #dce7ee;background:#fff;color:#5a7a8a;font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .18s}
        .pd-mc:hover{background:#f0f5f8}
        .pd-mb2{flex:1;padding:9px;border-radius:9px;border:none;background:linear-gradient(135deg,#1a3d2e,#2d6a4f);color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;text-decoration:none;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(26,61,46,.2);transition:box-shadow .18s}
        .pd-mb2:hover{box-shadow:0 6px 18px rgba(26,61,46,.35)}
        .pd-dm{background:#fff;border-radius:16px;max-width:360px;width:100%;padding:26px;text-align:center;animation:pd-in .22s ease}
        .pd-dmi{font-size:40px;margin-bottom:11px}
        .pd-dm h3{font-size:17px;font-weight:800;color:#0f1f22;margin:0 0 7px}
        .pd-dm p{font-size:13px;color:#6b8fa0;margin:0 0 18px;line-height:1.6}
        .pd-dbtns{display:flex;gap:10px}
        .pd-dcan{flex:1;padding:9px;border-radius:9px;border:1.5px solid #dce7ee;background:#fff;color:#5a7a8a;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
        .pd-dok{flex:1;padding:9px;border-radius:9px;border:none;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
        .pd-toast{position:fixed;bottom:26px;right:26px;z-index:2000;display:flex;align-items:center;gap:9px;background:#0a1f14;color:#fff;padding:11px 18px;border-radius:11px;font-size:13px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);animation:pd-slide .3s ease;border-left:4px solid #22c55e}
        .pd-toast.err{border-left-color:#ef4444}
        @media(max-width:900px){.pd-top{padding:0 20px}.pd-hero{padding:36px 20px 28px}.pd-tabs{padding:0 20px}.pd-body{padding:22px 20px 48px}}
        @media(max-width:600px){.pd-top{height:auto;padding:12px 16px;flex-wrap:wrap;gap:8px}.pd-uname{display:none}.pd-hero{padding:28px 16px 24px}.pd-body{padding:18px 14px 36px}.pd-stats{gap:8px}.pd-stat{padding:10px 12px;min-width:62px}.pd-sv{font-size:20px}.pd-notif-panel{width:calc(100vw - 32px);right:-80px}}
      `}</style>

      <div className="pd">
        {/* TOPBAR */}
        <header className="pd-top">
          <div className="pd-top-l">
            <Link to="/home" className="pd-back"><IconHome /> Home</Link>
            <span className="pd-logo">Cliniqo</span>
          </div>
          <div className="pd-top-r">
            {user && (
              <div className="pd-chip">
                <div className="pd-av">{(user.firstName?.[0] || "P").toUpperCase()}</div>
                <span className="pd-uname">{user.firstName} {user.lastName}</span>
              </div>
            )}
            <button className="pd-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        {/* HERO */}
        <section className="pd-hero">
          <div className="pd-hgrid" />
          <div className="pd-hinner">
            <div className={`pd-htxt ${heroVis ? "vis" : ""}`}>
              <div className="pd-htag"><span className="pd-htag-dot" />My Health Portal</div>
              <h1>{greeting},<br /><em>{user?.firstName || "there"}!</em></h1>
              <p>Manage appointments, prescriptions & consultations.</p>
            </div>
            <div className={`pd-stats ${heroVis ? "vis" : ""}`}>
              {[{ val: total, lbl: "Total" }, { val: pending, lbl: "Pending" }, { val: accepted, lbl: "Accepted" }, { val: completed, lbl: "Done" }].map((s, i) => (
                <div className="pd-stat" key={i}><div className="pd-sv">{s.val}</div><div className="pd-sl">{s.lbl}</div></div>
              ))}
            </div>
          </div>
        </section>

        {/* TABS */}
        <div className="pd-tabs">
          {[{ key: "appointments", label: "📅 Appointments" }, { key: "prescriptions", label: "💊 Prescriptions" }, { key: "video", label: "🎥 Video Calls" }, { key: "notifications", label: `🔔 Alerts ${unreadCount > 0 ? `(${unreadCount})` : ""}` }].map(t => (
            <button key={t.key} className={`pd-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => { setActiveTab(t.key);  }}>{t.label}</button>
          ))}
        </div>

        <div className="pd-body">

          {/* ══ APPOINTMENTS ══ */}
          {activeTab === "appointments" && <>
            <div className="pd-filter">
              {[{ key: "All", count: total }, { key: "Pending", count: pending }, { key: "Accepted", count: accepted }, { key: "Rejected", count: rejected }, { key: "Completed", count: completed }].map(f => (
                <button key={f.key} className={`pd-fbtn ${filter === f.key ? "on" : ""}`} onClick={() => setFilter(f.key)}>
                  {STATUS_META[f.key]?.icon || "📋"} {f.key}<span className="pd-fc">({f.count})</span>
                </button>
              ))}
              <button className="pd-ref" onClick={() => fetchAppointments(true)} disabled={refreshing}>
                <span className={`pd-reficon ${refreshing ? "s" : ""}`}>↻</span>
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {loading && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1, 2, 3].map(i => <div key={i} className="pd-skel" style={{ height: 80, animationDelay: `${i * .1}s` }} />)}</div>}

            {!loading && filtered.length === 0 && (
              <div className="pd-empty">
                <span className="pd-ei">🏥</span>
                <h3>{filter === "All" ? "No Appointments Yet" : `No ${filter} Appointments`}</h3>
                <p>{filter === "All" ? "Book your first appointment to get started." : `No ${filter.toLowerCase()} appointments found.`}</p>
                {filter === "All" && <Link to="/appointment" className="pd-cta">📅 Book Appointment</Link>}
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="pd-alist">
                {filtered.map((appt, i) => {
                  const sm = STATUS_META[appt.status] || STATUS_META.Pending;
                  const isLoading = videoLoading[appt._id];
                  const btnMeta = getVideoButtonMeta(appt._id, isLoading);
                  return (
                    <div key={appt._id} className="pd-acard" data-s={appt.status} style={{ animationDelay: `${i * .04}s` }} onClick={() => setSelectedAppt(appt)}>
                      <div className="pd-ainner">
                        <div className="pd-aico" style={{ background: sm.bg, border: `1px solid ${sm.border}` }}>{sm.icon}</div>
                        <div className="pd-ainfo">
                          <div className="pd-adoc">Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}</div>
                          <div className="pd-adept">{appt.department} Department</div>
                          <div className="pd-ameta">
                            <span className="pd-ami"><IconCal /> {fmtDate(appt.appointment_date)}</span>
                            {appt.appointment_time && <span className="pd-ami"><IconClk /> {appt.appointment_time}</span>}
                          </div>
                        </div>
                        <div className="pd-badge" style={{ background: sm.bg, color: sm.color, borderColor: sm.border }}>
                          <span className="pd-dot" style={{ background: sm.dot }} />{sm.label}
                        </div>
                      </div>
                      {(appt.status === "Accepted" || appt.status === "Rejected") && (
                        <div className="pd-banner" style={{ background: appt.status === "Accepted" ? "#ecfdf5" : "#fef2f2", borderColor: appt.status === "Accepted" ? "#6ee7b7" : "#fecaca", color: appt.status === "Accepted" ? "#065f46" : "#991b1b" }}>
                          {appt.status === "Accepted" ? "✅ Appointment accepted — please arrive on time." : "❌ Appointment rejected — please rebook or contact the clinic."}
                        </div>
                      )}
                      {appt.videoCallEnabled && (
                        <button
                          className="pd-video-btn"
                          style={{ background: btnMeta.bg, color: btnMeta.color, borderColor: btnMeta.border }}
                          disabled={btnMeta.disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            const vc = videoRequested[appt._id];
                            if (vc?.status === "Accepted" || vc?.status === "Ringing" || vc?.status === "Active") {
                              if (vc.roomId) {
                                navigate(`/video/${vc.roomId}`);
                              } else {
                                showToast("Room not ready yet. Please wait.", "error");
                              }
                              return;
                            }
                            handleVideoRequest(e, appt._id);
                          }}
                        >
                          {btnMeta.label}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && total > 0 && (
              <div style={{ marginTop: 24, textAlign: "center" }}>
                <Link to="/appointment" className="pd-cta">📅 Book Another Appointment</Link>
              </div>
            )}
          </>}

          {/* ══ PRESCRIPTIONS ══ */}
          {activeTab === "prescriptions" && <>
            {rxLoading && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1, 2].map(i => <div key={i} className="pd-skel" style={{ height: 110 }} />)}</div>}

            {!rxLoading && prescriptions.length === 0 && (
              <div className="pd-empty">
                <span className="pd-ei">💊</span>
                <h3>No Prescriptions Yet</h3>
                <p>Prescriptions from your doctors will appear here after consultations.</p>
              </div>
            )}

            {!rxLoading && prescriptions.length > 0 && (
              <div className="pd-rxlist">
                {prescriptions.map((rx, i) => {
                  const isHidden = hiddenIds.includes(rx._id);
                  const isNew = !hiddenIds.includes(`read_${rx._id}`);
                  const meds = rx.drugs?.map(d => d.name).filter(Boolean) || rx.medications || [];
                  return (
                    <div key={rx._id} className={`pd-rxcard ${isHidden ? "hid" : ""} ${isNew ? "nw" : ""}`} style={{ animationDelay: `${i * .05}s` }}>
                      <div className="pd-rxhead">
                        <div className="pd-rxico">💊</div>
                        <div className="pd-rxttl">
                          <strong>{rx.doctorName ? `Dr. ${rx.doctorName}` : `Dr. ${rx.doctor?.firstName || ""} ${rx.doctor?.lastName || ""}`}</strong>
                          <span>{fmtDate(rx.createdAt)} · {rx.diagnosis}</span>
                        </div>
                        {isNew && <span className="pd-nwbadge">New</span>}
                      </div>
                      {!isHidden && (
                        <div className="pd-rxbody">
                          {meds.length > 0 && <div className="pd-meds">{meds.map((m, j) => <span key={j} className="pd-med">{m}</span>)}</div>}
                          {rx.notes && <p className="pd-rnote">{rx.notes}</p>}
                        </div>
                      )}
                      {/* Action buttons — View & Download is the new one */}
                      <div className="pd-acts">
                        {/* Opens the prescription detail modal */}
                        <button className="pd-abtn view" onClick={() => setRxModal(rx)}>
                          👁️ View & Download
                        </button>
                        <button className={`pd-abtn ${isHidden ? "sh" : "hi"}`} onClick={() => toggleHide(rx._id)}>
                          {isHidden ? <><IconEye /> Show</> : <><IconEyeOff /> Hide</>}
                        </button>
                        <button className="pd-abtn dl" onClick={() => setDelModal({ open: true, id: rx._id, type: "prescription" })}>
                          <IconTrash /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>}

          {/* ══ VIDEO CALLS ══ */}
          {activeTab === "video" && <>
            {videoSessions.length === 0 && (
              <div className="pd-empty">
                <span className="pd-ei">🎥</span>
                <h3>No Video Consultations</h3>
                <p>Completed video calls with your doctors will be listed here.</p>
              </div>
            )}
          </>}

          {/* ══ NOTIFICATIONS ══ */}
          {activeTab === "notifications" && (
            <div style={{ animation: "pd-up .4s ease" }}>
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e4edf5", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#1a3d2e" }}>Notifications</div>
                  <div style={{ fontSize: 12, color: "#6b8fa0", marginTop: 2 }}>{notifications.length} total</div>
                </div>
                {notifications.length === 0
                  ? <div style={{ padding: "40px 20px", textAlign: "center", color: "#6b8fa0", fontSize: 13 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                    No notifications yet.
                  </div>
                  : notifications.map(n => (
                    <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f1f22" }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: "#6b8fa0", marginTop: 3 }}>{fmtDate(n.time)}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRESCRIPTION DETAIL MODAL — opens when "View & Download" is clicked */}
      {rxModal && (
        <PrescriptionModal
          rx={rxModal}
          patientName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
          onClose={() => setRxModal(null)}
        />
      )}

      {/* APPOINTMENT DETAIL MODAL */}
      {selectedAppt && (() => {
        const appt = selectedAppt;
        const sm = STATUS_META[appt.status] || STATUS_META.Pending;
        return (
          <div className="pd-ov" onClick={() => setSelectedAppt(null)}>
            <div className="pd-modal" onClick={e => e.stopPropagation()}>
              <div className="pd-mh"><h3>Appointment Details</h3><p>Booked on {fmtDate(appt.createdAt)}</p></div>
              <div className="pd-mb">
                {[
                  { icon: "🩺", label: "Doctor", value: `Dr. ${appt.doctor?.firstName} ${appt.doctor?.lastName}` },
                  { icon: "🏥", label: "Department", value: appt.department },
                  { icon: "📅", label: "Date", value: fmtDate(appt.appointment_date) },
                  { icon: "🕐", label: "Time", value: appt.appointment_time || "Not specified" },
                  { icon: "👤", label: "Patient", value: `${appt.firstName} ${appt.lastName}` },
                  { icon: "📞", label: "Phone", value: appt.phone },
                  { icon: "📹", label: "Video Call", value: appt.videoCallEnabled ? "Enabled ✅" : "Not available yet" },
                  {
                    icon: sm.icon, label: "Status", value: <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, fontWeight: 700, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sm.dot, display: "inline-block" }} />{sm.label}
                    </span>
                  },
                ].map((row, i) => (
                  <div className="pd-mr" key={i}>
                    <div className="pd-mi">{row.icon}</div>
                    <div className="pd-mt"><strong>{row.label}</strong><span>{row.value}</span></div>
                  </div>
                ))}
              </div>
              <div className="pd-mf">
                <button className="pd-mc" onClick={() => setSelectedAppt(null)}>Close</button>
                <Link to="/appointment" className="pd-mb2">📅 Book New</Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DELETE MODAL */}
      {delModal.open && (
        <div className="pd-ov" onClick={() => setDelModal({ open: false, id: null, type: null })}>
          <div className="pd-dm" onClick={e => e.stopPropagation()}>
            <div className="pd-dmi">🗑️</div>
            <h3>Delete {delModal.type === "prescription" ? "Prescription" : "Session"}?</h3>
            <p>This cannot be undone. Are you sure you want to permanently remove this item?</p>
            <div className="pd-dbtns">
              <button className="pd-dcan" onClick={() => setDelModal({ open: false, id: null, type: null })}>Cancel</button>
              <button className="pd-dok" onClick={executeDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`pd-toast ${toast.type === "error" ? "err" : ""}`}>{toast.type === "error" ? "❌" : "✅"} {toast.msg}</div>}
    </>
  );
};

export default PatientDashboard;