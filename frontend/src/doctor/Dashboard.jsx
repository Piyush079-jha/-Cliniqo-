import { useState, useEffect, useRef, useContext, useCallback } from "react";
import "regenerator-runtime/runtime";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../main";
import { useSocket } from "../context/SocketContext";
import ringtoneFile from "../assets/ringtone.mp3";
import SR, { useSpeechRecognition } from "react-speech-recognition";
import DOMPurify from "dompurify";
const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com";


// Formatters
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const fmtTimeAgo = (d) => {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const dedup = (str) => {
  if (!str) return str;
  const words = str.trim().split(/\s+/);
  const half = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, half).join(" ").toLowerCase();
  const secondHalf = words.slice(half).join(" ").toLowerCase();
  if (firstHalf === secondHalf) return words.slice(0, half).join(" ");
  return words.filter((w, i) => i === 0 || w.toLowerCase() !== words[i - 1].toLowerCase()).join(" ");
};
const isToday = (ds) => {
  if (!ds) return false;
  const d = new Date(ds),
    t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
};

//  Status config (matches Patient Dashboard palette exactly)
const APPT_STATUS = {
  Pending: {
    bg: "#fffbeb",
    color: "#92400e",
    border: "#fde68a",
    dot: "#f59e0b",
    icon: "⏳",
    strip: "#f59e0b",
    label: "Pending",
  },
  Accepted: {
    bg: "#ecfdf5",
    color: "#065f46",
    border: "#6ee7b7",
    dot: "#10b981",
    icon: "✅",
    strip: "#10b981",
    label: "Accepted",
  },
  Confirmed: {
    bg: "#eff6ff",
    color: "#1e40af",
    border: "#bfdbfe",
    dot: "#3b82f6",
    icon: "📋",
    strip: "#3b82f6",
    label: "Confirmed",
  },
  Completed: {
    bg: "#f0fdf4",
    color: "#166534",
    border: "#bbf7d0",
    dot: "#22c55e",
    icon: "🎉",
    strip: "#22c55e",
    label: "Completed",
  },
  Rejected: {
    bg: "#fef2f2",
    color: "#991b1b",
    border: "#fecaca",
    dot: "#ef4444",
    icon: "❌",
    strip: "#ef4444",
    label: "Rejected",
  },
  Cancelled: {
    bg: "#f9fafb",
    color: "#374151",
    border: "#d1d5db",
    dot: "#9ca3af",
    icon: "🚫",
    strip: "#9ca3af",
    label: "Cancelled",
  },
};
const VC_STATUS = {
  Pending: {
    bg: "#fffbeb",
    color: "#92400e",
    border: "#fde68a",
    dot: "#f59e0b",
  },
  Accepted: {
    bg: "#ecfdf5",
    color: "#065f46",
    border: "#6ee7b7",
    dot: "#10b981",
  },
  Ringing: {
    bg: "#eff6ff",
    color: "#1e40af",
    border: "#bfdbfe",
    dot: "#3b82f6",
  },
  Active: {
    bg: "#f0fdf4",
    color: "#166534",
    border: "#bbf7d0",
    dot: "#22c55e",
  },
  Rejected: {
    bg: "#fef2f2",
    color: "#991b1b",
    border: "#fecaca",
    dot: "#ef4444",
  },
  Declined: {
    bg: "#fef2f2",
    color: "#991b1b",
    border: "#fecaca",
    dot: "#ef4444",
  },
  Missed: {
    bg: "#fffbeb",
    color: "#92400e",
    border: "#fde68a",
    dot: "#f59e0b",
  },
  Ended: { bg: "#f9fafb", color: "#374151", border: "#d1d5db", dot: "#9ca3af" },
  Completed: {
    bg: "#f0fdf4",
    color: "#166534",
    border: "#bbf7d0",
    dot: "#22c55e",
  },
};

// Inline SVG icons (same style as Patient Dashboard) 
const IconHome = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconRefresh = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IconBell = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconSend = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconSave = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const IconPrint = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconSearch = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconCal = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconClk = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

//css style
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

@keyframes dd-up    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes dd-in    { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
@keyframes dd-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes dd-spin  { to{transform:rotate(360deg)} }
@keyframes dd-slide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes dd-shim  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes va-breathe {
  0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.0), 0 0 28px rgba(139,92,246,0.3), 0 12px 40px rgba(0,0,0,0.5); }
  50%     { box-shadow: 0 0 0 16px rgba(139,92,246,0.1), 0 0 52px rgba(139,92,246,0.6), 0 12px 40px rgba(0,0,0,0.5); }
}
@keyframes va-breathe-speak {
  0%,100% { box-shadow: 0 0 0 0 rgba(99,179,237,0.0), 0 0 28px rgba(99,179,237,0.35), 0 12px 40px rgba(0,0,0,0.5); }
  50%     { box-shadow: 0 0 0 16px rgba(99,179,237,0.12), 0 0 52px rgba(99,179,237,0.6), 0 12px 40px rgba(0,0,0,0.5); }
}
@keyframes va-ripple {
  0%   { transform:scale(1);   opacity:0.6; }
  100% { transform:scale(2.6); opacity:0;   }
}
@keyframes va-hud-in {
  from { opacity:0; transform:translateY(12px) scale(0.96); }
  to   { opacity:1; transform:translateY(0)    scale(1);    }
}
@keyframes va-bar {
  0%,100% { transform:scaleY(0.35); }
  50%     { transform:scaleY(1.4);  }
}
@keyframes va-ping {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0;   }
}
@keyframes va-click {
  0%   { transform:scale(1);    }
  40%  { transform:scale(0.91); }
  100% { transform:scale(1);    }
}
@keyframes va-off-press {
  0%   { transform:scale(1);    }
  40%  { transform:scale(0.88); }
  100% { transform:scale(1);    }
}
*,*::before,*::after { box-sizing:border-box }

/* ─── ROOT — same as Patient Dashboard ─── */
.dd { font-family:'Plus Jakarta Sans',sans-serif; background:#f0f4f8; min-height:100vh }

/* ─── TOPBAR — identical structure, same dark green ─── */
.dd-top {
  position:sticky; top:0; z-index:100;
  background:#0a1f14;
  border-bottom:1px solid rgba(255,255,255,.08);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 32px; height:60px;
  box-shadow:0 2px 16px rgba(0,0,0,.25)
}
.dd-top-l { display:flex; align-items:center; gap:14px }
.dd-back {
  display:flex; align-items:center; gap:7px;
  background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.15);
  color:#fff; padding:7px 14px; border-radius:8px;
  cursor:pointer; font-size:13px; font-weight:600;
  font-family:'Plus Jakarta Sans',sans-serif; transition:all .18s; text-decoration:none
}
.dd-back:hover { background:rgba(255,255,255,.16); transform:translateX(-2px) }
.dd-logo { font-family:'Playfair Display',serif; font-size:22px; color:#fff; font-style:normal; font-weight:700; letter-spacing:-0.5px }
.dd-top-r { display:flex; align-items:center; gap:10px }
.dd-chip {
  display:flex; align-items:center; gap:8px;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
  border-radius:20px; padding:5px 12px 5px 6px
}
.dd-av {
  width:28px; height:28px; border-radius:50%;
  background:linear-gradient(135deg,#c9a84c,#e8cc80);
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:800; color:#0a1f14
}
.dd-uname { font-size:13px; font-weight:600; color:rgba(255,255,255,.85) }
.dd-icon-btn {
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
  color:rgba(255,255,255,.7); width:36px; height:36px; border-radius:9px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all .18s; position:relative; flex-shrink:0
}
.dd-icon-btn:hover { background:rgba(255,255,255,.16) }
.dd-icon-btn.spin svg { animation:dd-spin .7s linear infinite }
.dd-notif-badge {
  position:absolute; top:-5px; right:-5px;
  background:#ef4444; color:#fff; border-radius:999px;
  font-size:9px; font-weight:700; padding:1px 5px;
  border:2px solid #0a1f14
}
.dd-logout {
  background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3);
  color:#fca5a5; padding:7px 14px; border-radius:8px;
  cursor:pointer; font-size:13px; font-weight:600;
  font-family:'Plus Jakarta Sans',sans-serif; transition:all .18s
}
.dd-logout:hover { background:rgba(239,68,68,.22) }

/* ─── HERO — same dark green gradient as Patient Dashboard ─── */
.dd-hero {
  background:linear-gradient(135deg,#0a1f14 0%,#133d22 60%,#1a5c35 100%);
  padding:48px 40px 38px; position:relative; overflow:hidden
}
.dd-hero::after {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:linear-gradient(90deg,transparent,#c9a84c,#f0d980,#c9a84c,transparent)
}
.dd-hgrid {
  position:absolute; inset:0; pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
  background-size:40px 40px
}
.dd-hinner {
  position:relative; z-index:1; max-width:1200px; margin:0 auto;
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:28px; flex-wrap:wrap
}
.dd-htxt { opacity:0 }
.dd-htxt.vis { animation:dd-up .7s cubic-bezier(.22,1,.36,1) forwards }
.dd-htag {
  display:inline-flex; align-items:center; gap:7px;
  background:rgba(201,168,76,.15); border:1px solid rgba(201,168,76,.35);
  color:#c9a84c; padding:4px 12px; border-radius:999px;
  font-size:11px; font-weight:700; letter-spacing:1.2px;
  text-transform:uppercase; margin-bottom:13px
}
.dd-htag-dot { width:6px; height:6px; border-radius:50%; background:#c9a84c; animation:dd-blink 2s infinite }
.dd-htxt h1 {
  font-family:'Playfair Display',serif; font-size:clamp(22px,3vw,36px);
  color:#fff; font-weight:700; line-height:1.1; margin:0 0 10px
}
.dd-htxt h1 em { font-style:italic; color:#c9a84c }
.dd-htxt p { color:rgba(255,255,255,.5); font-size:13.5px; margin:0 }
.dd-stats { display:flex; gap:11px; flex-wrap:wrap; opacity:0 }
.dd-stats.vis { animation:dd-up .7s .1s cubic-bezier(.22,1,.36,1) forwards }
.dd-stat {
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
  border-radius:14px; padding:13px 18px; text-align:center;
  min-width:76px; transition:background .2s; cursor:pointer
}
.dd-stat:hover { background:rgba(255,255,255,.12) }
.dd-sv { font-size:24px; font-weight:800; color:#c9a84c }
.dd-sl { font-size:10px; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:1px; margin-top:3px }

/* ─── TABS — exact copy from Patient Dashboard ─── */
.dd-tabs {
  background:#fff; border-bottom:1px solid #e4edf5;
  padding:0 40px; display:flex; gap:4px;
  position:sticky; top:60px; z-index:90;
  box-shadow:0 2px 8px rgba(0,0,0,.04); overflow-x:auto
}
.dd-tabs::-webkit-scrollbar { height:0 }
.dd-tab {
  display:flex; align-items:center; gap:7px;
  padding:15px 18px; font-size:13.5px; font-weight:600;
  color:#6b7e8f; border:none; background:none; cursor:pointer;
  position:relative; font-family:'Plus Jakarta Sans',sans-serif;
  transition:color .18s; border-bottom:2.5px solid transparent;
  margin-bottom:-1px; white-space:nowrap; flex-shrink:0
}
.dd-tab:hover { color:#1a3d2e }
.dd-tab.active { color:#1a3d2e; border-bottom-color:#1a3d2e }
.dd-tab-badge {
  background:#ef4444; color:#fff; border-radius:999px;
  font-size:9px; font-weight:800; padding:2px 6px; margin-left:2px
}

/* ─── BODY ─── */
.dd-body { max-width:1200px; margin:0 auto; padding:30px 40px 60px }

/* ─── SECTION HEADER ─── */
.dd-sec-hd {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:16px; flex-wrap:wrap; gap:10px
}
.dd-sec-title { font-family:'Playfair Display',serif; font-size:20px; color:#1a3d2e; font-weight:700 }
.dd-sec-sub { font-size:12px; color:#6b8fa0; margin-top:2px }

/* ─── FILTER BAR — matches Patient Dashboard ─── */
.dd-filter { display:flex; align-items:center; gap:8px; margin-bottom:20px; flex-wrap:wrap }
.dd-fbtn {
  padding:6px 15px; border-radius:20px; border:1.5px solid #dce7ee;
  background:#fff; cursor:pointer; font-size:12.5px; font-weight:700;
  color:#5a7a8a; transition:all .18s; font-family:'Plus Jakarta Sans',sans-serif
}
.dd-fbtn:hover { border-color:#1a3d2e; color:#1a3d2e }
.dd-fbtn.on { background:#1a3d2e; color:#fff; border-color:#1a3d2e }
.dd-fc { font-size:10px; opacity:.65; margin-left:3px }
.dd-ref {
  margin-left:auto; display:flex; align-items:center; gap:6px;
  padding:6px 13px; border-radius:20px; border:1.5px solid #dce7ee;
  background:#fff; cursor:pointer; font-size:12px; font-weight:700;
  color:#5a7a8a; transition:all .18s; font-family:'Plus Jakarta Sans',sans-serif
}
.dd-ref:hover { border-color:#1a3d2e; color:#1a3d2e }

/* ─── STAT CARDS GRID (overview) ─── */
.dd-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px }
.dd-scard {
  background:#fff; border-radius:16px; border:1.5px solid #e4edf5;
  padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.04);
  transition:transform .2s,box-shadow .2s; cursor:pointer;
  animation:dd-up .4s ease both
}
.dd-scard:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,.09) }
.dd-scard-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px }
.dd-scard-ico { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px }
.dd-scard-val { font-family:'Playfair Display',serif; font-size:28px; font-weight:700 }
.dd-scard-label { font-size:11px; font-weight:700; color:#6b8fa0; text-transform:uppercase; letter-spacing:.6px }
.dd-scard-sub { font-size:11px; color:#94a3b8; margin-top:3px }

/* ─── APPOINTMENT / PATIENT CARDS — same as Patient Dashboard cards ─── */
.dd-list { display:flex; flex-direction:column; gap:11px }
.dd-acard {
  background:#fff; border-radius:15px; border:1.5px solid #e4edf5;
  box-shadow:0 2px 8px rgba(0,0,0,.04); overflow:hidden;
  position:relative; transition:transform .2s,box-shadow .2s;
  animation:dd-up .3s ease both
}
.dd-acard:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(0,0,0,.09) }
.dd-ainner { display:flex; align-items:center; gap:14px; padding:15px 18px 15px 22px; flex-wrap:wrap }
.dd-aico { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0 }
.dd-ainfo { flex:1; min-width:140px }
.dd-aname { font-size:14px; font-weight:700; color:#0f1f22; margin-bottom:2px }
.dd-ameta { font-size:12px; color:#6b8fa0; margin-bottom:5px }
.dd-ametarow { display:flex; align-items:center; gap:10px; flex-wrap:wrap }
.dd-ami { display:flex; align-items:center; gap:4px; font-size:12px; color:#5a7a8a }
.dd-badge {
  display:flex; align-items:center; gap:6px;
  padding:5px 12px; border-radius:999px;
  font-size:12px; font-weight:700; border:1px solid;
  flex-shrink:0; white-space:nowrap
}
.dd-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0 }
.dd-acard[data-pending="true"] .dd-dot { animation:dd-blink 1.5s infinite }
.dd-actions { display:flex; gap:6px; flex-shrink:0; flex-wrap:wrap }
.dd-banner { display:flex; align-items:center; gap:10px; padding:8px 22px; border-top:1px solid; font-size:12.5px; font-weight:600 }

/* ─── ACTION BUTTONS — green-toned matching Patient Dashboard ─── */
.dd-btn {
  display:flex; align-items:center; gap:5px;
  padding:6px 13px; border-radius:8px;
  font-size:12.5px; font-weight:700; cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  transition:all .18s; border:1.5px solid
}
.dd-btn:hover { transform:translateY(-1px) }
.dd-btn.accept   { background:#ecfdf5; border-color:#6ee7b7; color:#065f46 }
.dd-btn.accept:hover { background:#d1fae5 }
.dd-btn.reject   { background:#fef2f2; border-color:#fecaca; color:#991b1b }
.dd-btn.reject:hover { background:#fee2e2 }
.dd-btn.complete { background:#eff6ff; border-color:#bfdbfe; color:#1e40af }
.dd-btn.complete:hover { background:#dbeafe }
.dd-btn.cancel   { background:#fef2f2; border-color:#fecaca; color:#991b1b }
.dd-btn.cancel:hover { background:#fee2e2 }
.dd-btn.rx       { background:#f0fdf4; border-color:#bbf7d0; color:#166534 }
.dd-btn.rx:hover { background:#dcfce7 }
.dd-btn.video    {
  background:linear-gradient(135deg,#1a3d2e,#2d6a4f);
  border-color:transparent; color:#fff;
  box-shadow:0 3px 10px rgba(26,61,46,.2)
}
.dd-btn.video:hover { box-shadow:0 5px 16px rgba(26,61,46,.35) }
.dd-btn.primary  {
  background:linear-gradient(135deg,#1a3d2e,#2d6a4f);
  border-color:transparent; color:#fff
}

/* ─── PATIENT SEARCH ─── */
.dd-search-wrap { position:relative; max-width:320px; margin-bottom:16px }
.dd-search-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8 }
.dd-search {
  width:100%; padding:9px 12px 9px 36px;
  border:1.5px solid #e4edf5; border-radius:10px;
  font-size:13.5px; outline:none;
  font-family:'Plus Jakarta Sans',sans-serif;
  color:#0f1f22; background:#fff; transition:border-color .18s
}
.dd-search:focus { border-color:#1a3d2e; box-shadow:0 0 0 3px rgba(26,61,46,.08) }

/* ─── PRESCRIPTION FORM ─── */
.dd-rx-wrap {
  background:#fff; border-radius:16px;
  border:1.5px solid #e4edf5; overflow:hidden;
  box-shadow:0 2px 8px rgba(0,0,0,.04); margin-bottom:20px
}
.dd-rx-hd {
  padding:18px 22px;
  background:linear-gradient(135deg,#0a1f14,#133d22);
  position:relative; overflow:hidden
}
.dd-rx-hd::after {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg,transparent,#c9a84c,transparent)
}
.dd-rx-hd h2 { font-family:'Playfair Display',serif; font-size:17px; color:#fff; margin:0 0 3px }
.dd-rx-hd p  { font-size:12px; color:rgba(255,255,255,.45); margin:0 }
.dd-rx-body  { padding:22px }
.dd-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px }
.dd-label { display:block; font-size:10px; font-weight:700; color:#6b8fa0; text-transform:uppercase; letter-spacing:.6px; margin-bottom:5px }
.dd-input {
  width:100%; padding:9px 12px;
  border:1.5px solid #e4edf5; border-radius:10px;
  font-size:13.5px; outline:none;
  font-family:'Plus Jakarta Sans',sans-serif;
  color:#0f1f22; background:#fff; transition:border-color .18s
}
.dd-input:focus { border-color:#1a3d2e; box-shadow:0 0 0 3px rgba(26,61,46,.08) }
.dd-drug-row { display:flex; gap:8px; margin-bottom:8px; align-items:center; flex-wrap:wrap }
.dd-drug-del {
  width:30px; height:30px; border:none; border-radius:8px;
  background:#fef2f2; color:#dc2626; cursor:pointer;
  display:flex; align-items:center; justify-content:center; flex-shrink:0
}
.dd-drug-del:hover { background:#fee2e2 }
.dd-rx-actions { display:flex; gap:10px }
.dd-rx-btn {
  flex:1; padding:11px; border-radius:10px; border:none;
  font-size:14px; font-weight:700; cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  display:flex; align-items:center; justify-content:center; gap:8px; transition:all .18s
}
.dd-rx-btn.save {
  background:linear-gradient(135deg,#1a3d2e,#2d6a4f);
  color:#fff; box-shadow:0 4px 14px rgba(26,61,46,.2)
}
.dd-rx-btn.save:hover { box-shadow:0 6px 20px rgba(26,61,46,.35); transform:translateY(-1px) }
.dd-rx-btn.print {
  background:linear-gradient(135deg,#133d22,#1a5c35); color:#fff
}
.dd-rx-btn.print:hover { filter:brightness(.92); transform:translateY(-1px) }
.dd-rx-btn:disabled { background:#94a3b8; cursor:not-allowed; transform:none; box-shadow:none }
.dd-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:dd-spin .8s linear infinite }

/* ─── VIDEO CONSULT BANNER ─── */
.dd-vc-banner {
  background:linear-gradient(135deg,#0a1f14,#133d22);
  border-radius:15px; padding:22px 26px; margin-bottom:22px;
  color:#fff; display:flex; align-items:center; gap:20px;
  position:relative; overflow:hidden
}
.dd-vc-banner::after {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg,transparent,#c9a84c,transparent)
}
.dd-vc-num { font-family:'Playfair Display',serif; font-size:48px; color:#c9a84c; font-weight:700; line-height:1 }
.dd-vc-lbl { font-size:11px; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:.8px }

/* ─── AI ASSISTANT ─── */
.dd-ai-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px }
.dd-ai-card { background:#fff; border-radius:16px; border:1.5px solid #e4edf5; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04) }
.dd-ai-hd { padding:16px 20px; background:linear-gradient(135deg,#0a1f14,#133d22); position:relative; overflow:hidden }
.dd-ai-hd::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,#c9a84c,transparent) }
.dd-chat-hd { padding:16px 20px; background:linear-gradient(135deg,#133d22,#1a5c35); position:relative; overflow:hidden }
.dd-chat-hd::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,#c9a84c,transparent) }
.dd-ai-hd h3,.dd-chat-hd h3 { font-family:'Playfair Display',serif; font-size:15px; color:#fff; margin:0 0 2px }
.dd-ai-hd p,.dd-chat-hd p  { font-size:11px; color:rgba(255,255,255,.45); margin:0 }
.dd-ai-body { padding:18px }
.dd-chat-body { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; background:#f8fafc }
.dd-chat-wrap { display:flex; flex-direction:column; overflow:hidden; height:500px }
.dd-bubble { max-width:85%; padding:10px 13px; border-radius:12px; font-size:13px; line-height:1.6 }
.dd-bubble.ai  { background:#fff; border:1px solid #e2e8f0; color:#0f1f22; align-self:flex-start }
.dd-bubble.doc { background:linear-gradient(135deg,#1a3d2e,#2d6a4f); color:#fff; align-self:flex-end }
.dd-chat-input { padding:10px 12px; border-top:1px solid #f1f5f9; display:flex; gap:8px }
.dd-chat-send {
  width:36px; height:36px; border-radius:9px; border:none;
  background:linear-gradient(135deg,#1a3d2e,#2d6a4f);
  color:#fff; display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:filter .18s
}
.dd-chat-send:hover { filter:brightness(.88) }
.dd-urgency { padding:8px 14px; border-radius:8px; background:#fffbeb; border:1px solid #fde68a; color:#92400e; font-weight:700; font-size:13px; margin-bottom:12px }
.dd-dx-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #f1f5f9; font-size:13px }
.dd-test-tag { padding:3px 10px; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; border-radius:999px; font-size:11px; font-weight:600 }

/* ─── NOTIFICATIONS ─── */
.dd-notif-card { background:#fff; border-radius:16px; border:1.5px solid #e4edf5; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04); max-width:640px }
.dd-notif-row { display:flex; align-items:flex-start; gap:12px; padding:14px 20px; border-bottom:1px solid #f8fafc; cursor:pointer; transition:background .15s }
.dd-notif-row:hover { background:#f8fafc }
.dd-notif-row.unread { background:#f0fdf4 }
.dd-notif-ico { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0 }

/* ─── PROFILE ─── */
.dd-profile-wrap { max-width:600px }
.dd-profile-card { background:#fff; border-radius:16px; border:1.5px solid #e4edf5; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04) }
.dd-profile-hd { padding:18px 22px; background:linear-gradient(135deg,#0a1f14,#133d22); position:relative; overflow:hidden }
.dd-profile-hd::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,#c9a84c,transparent) }
.dd-profile-hd h2 { font-family:'Playfair Display',serif; font-size:17px; color:#fff; margin:0 }
.dd-profile-body { padding:22px }
.dd-profile-banner {
  display:flex; align-items:center; gap:16px; padding:16px;
  background:linear-gradient(135deg,#f0f9f4,#e0f5ea);
  border:1px solid #bbf7d0; border-radius:12px; margin-bottom:22px
}
.dd-big-av {
  width:64px; height:64px; border-radius:50%;
  background:linear-gradient(135deg,#c9a84c,#e8cc80);
  display:flex; align-items:center; justify-content:center;
  font-size:22px; font-weight:800; color:#0a1f14; flex-shrink:0
}
.dd-status-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; color:#1a3d2e; margin-top:5px }
.dd-status-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; animation:dd-blink 2s infinite }

/* ─── CALL TO ACTION LINK (matches Patient Dashboard) ─── */
.dd-cta {
  display:inline-flex; align-items:center; gap:7px;
  padding:11px 22px; border-radius:10px;
  background:linear-gradient(135deg,#1a3d2e,#2d6a4f);
  color:#fff; font-size:13px; font-weight:700; text-decoration:none;
  box-shadow:0 4px 14px rgba(26,61,46,.2); transition:transform .2s,box-shadow .2s
}
.dd-cta:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(26,61,46,.3) }

/* ─── SKELETON ─── */
.dd-skel {
  background:linear-gradient(90deg,#edf2f7 25%,#e2eaf0 50%,#edf2f7 75%);
  background-size:200% 100%; animation:dd-shim 1.5s infinite; border-radius:14px
}

/* ─── EMPTY STATE ─── */
.dd-empty { background:#fff; border-radius:16px; border:1.5px solid #e4edf5; padding:56px 36px; text-align:center; animation:dd-up .4s ease }
.dd-empty-icon { font-size:46px; display:block; margin-bottom:13px }
.dd-empty h3 { font-family:'Playfair Display',serif; font-size:21px; color:#1a3d2e; margin:0 0 8px }
.dd-empty p  { font-size:13.5px; color:#6b8fa0; max-width:280px; margin:0 auto; line-height:1.7 }

/* ─── MODAL ─── */
.dd-ov { position:fixed; inset:0; background:rgba(0,0,0,.45); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; animation:dd-in .2s ease }
.dd-modal { background:#fff; border-radius:20px; max-width:460px; width:100%; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,.2); animation:dd-in .22s cubic-bezier(.22,1,.36,1) }
.dd-modal-hd { padding:20px 22px; background:#0a1f14; position:relative; overflow:hidden }
.dd-modal-hd::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,#c9a84c,transparent) }
.dd-modal-hd h3 { font-family:'Playfair Display',serif; font-size:19px; color:#fff; margin:0 0 3px }
.dd-modal-hd p  { font-size:12px; color:rgba(255,255,255,.45); margin:0 }
.dd-modal-body  { padding:18px 22px }
.dd-modal-row   { display:flex; align-items:flex-start; gap:11px; padding:8px 0; border-bottom:1px solid #f0f5f8 }
.dd-modal-row:last-child { border-bottom:none }
.dd-modal-ico   { width:30px; height:30px; border-radius:9px; background:rgba(26,61,46,.06); border:1px solid rgba(26,61,46,.1); display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0 }
.dd-modal-row strong { display:block; font-size:10.5px; font-weight:700; color:#6b8fa0; text-transform:uppercase; letter-spacing:.5px; margin-bottom:1px }
.dd-modal-row span   { font-size:13px; font-weight:600; color:#0f1f22 }
.dd-modal-foot  { padding:13px 22px; border-top:1px solid #f0f5f8; display:flex; gap:10px }
.dd-modal-cancel { flex:1; padding:9px; border-radius:9px; border:1.5px solid #dce7ee; background:#fff; color:#5a7a8a; font-size:12.5px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif }
.dd-modal-cancel:hover { background:#f0f5f8 }

/* ─── TOAST — identical to Patient Dashboard ─── */
.dd-toast { position:fixed; bottom:26px; right:26px; z-index:2000; display:flex; align-items:center; gap:9px; background:#0a1f14; color:#fff; padding:11px 18px; border-radius:11px; font-size:13px; font-weight:600; font-family:'Plus Jakarta Sans',sans-serif; box-shadow:0 8px 24px rgba(0,0,0,.25); animation:dd-slide .3s ease; border-left:4px solid #22c55e }
.dd-toast.err { border-left-color:#ef4444 }

/* ─── RESPONSIVE — mirrors Patient Dashboard breakpoints ─── */
@media(max-width:1024px) {
  .dd-stats-grid { grid-template-columns:repeat(2,1fr) }
  .dd-ai-grid { grid-template-columns:1fr }
}
@media(max-width:900px) {
  .dd-top { padding:0 20px }
  .dd-hero { padding:36px 20px 28px }
  .dd-tabs { padding:0 20px }
  .dd-body { padding:22px 20px 48px }
}
@media(max-width:680px) {
  .dd-stats-grid { grid-template-columns:1fr 1fr }
  .dd-field-grid  { grid-template-columns:1fr }
  .dd-rx-actions  { flex-direction:column }
  .dd-ainner      { gap:10px }
  .dd-actions     { width:100% }
}
@media(max-width:600px) {
  .dd-top { height:auto; padding:12px 16px; flex-wrap:wrap; gap:8px }
  .dd-uname { display:none }
  .dd-hero  { padding:28px 16px 24px }
  .dd-body  { padding:18px 14px 36px }
  .dd-stats { gap:8px }
  .dd-stat  { padding:10px 12px; min-width:62px }
  .dd-sv    { font-size:20px }
}
@media(max-width:480px) {
  .dd-stats-grid { grid-template-columns:1fr 1fr }
  .dd-tabs { padding:0 12px }
  .dd-tab  { padding:13px 11px; font-size:12px }
  .dd-body { padding:16px 12px 36px }
}
`;

export default function DoctorDashboard() {
  const { doctor, setIsDoctorAuthenticated, setDoctor } = useContext(Context);
  const navigate = useNavigate();
  const { socketRef } = useSocket();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseNotesRef = useRef("");
  const lastTranscriptRef = useRef("");
  // ── Voice prescription dictation ──
  const [isListening, setIsListening] = useState(false);

  // ── Sara voice assistant ──
  const [voiceActive,  setVoiceActive]  = useState(false);
  const [vaListening,  setVaListening]  = useState(false);
  const [vaSpeaking,   setVaSpeaking]   = useState(false);

  // Refs — never trigger re-renders
  const vaActiveRef               = useRef(false);
  const vaRecogRef                = useRef(null);
  const isListeningLockRef        = useRef(false);
  const interruptRef              = useRef(false);
  const hasSpokeRef               = useRef(false);
  const wakeWordRef               = useRef(null);
  const speakAbortRef             = useRef(null);
  const interruptRecogRef         = useRef(null);   // track interrupt mic globally
  const speakWatchdogRef          = useRef(null);
  const speakingBlockUntilRef     = useRef(0);
  const rxFlowRef                 = useRef(null);
  const rxReAskTimerRef               = useRef(null);
const stepTransitionRef             = useRef(0); 
  const deactivateVoiceAssistantRef   = useRef(null);
  const voiceCacheRef = useRef({ voice: null, lang: navigator.language });
  const micRetryCountRef = useRef(0);
  const MIC_RETRY_LIMIT = 5;
  // const speakingBlockUntilRef     = useRef(0);

  // Stable function refs (always point to latest closure)
  const handleVoiceCommandRef        = useRef(null);
  const activateVoiceAssistantRef    = useRef(null);
  const startContinuousListeningRef  = useRef(null);

  // Sara conversation memory — persists for the browser session (not across reloads)
  const saraMemoryRef = useRef((() => {
    try {
      const saved = sessionStorage.getItem("sara_memory");
      return saved
        ? JSON.parse(saved)
        : { lastPatient: null, lastAction: null, lastTab: null, turns: [] };
    } catch {
      return { lastPatient: null, lastAction: null, lastTab: null, turns: [] };
    }
  })());

  const updateSaraMemory = useCallback((patch) => {
    saraMemoryRef.current = { ...saraMemoryRef.current, ...patch };
    try {
      const mem = { ...saraMemoryRef.current };
      if (mem.turns.length > 20) mem.turns = mem.turns.slice(-20);
      // Redact PII — only store non-identifiable fields
      const safeToStore = {
        lastAction: mem.lastAction,
        lastTab:    mem.lastTab,
        turns:      mem.turns.map(t => ({ ts: t.ts })),
      };
      sessionStorage.setItem("sara_memory", JSON.stringify(safeToStore));
    } catch (_) {}
  }, []);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const [activeTab, setActiveTab] = useState("overview");
  const [heroVis, setHeroVis] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selAppt, setSelAppt] = useState(null);

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptFilter, setApptFilter] = useState("All");

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Prescriptions
  const [rxHistory, setRxHistory] = useState([]);
  const [rxEditMode, setRxEditMode] = useState(false);
  const [rxEditId, setRxEditId] = useState(null);
  const [rxViewModal, setRxViewModal] = useState(null);
  const [rxDeleteConfirm, setRxDeleteConfirm] = useState(null);
  const [rxDeleting, setRxDeleting] = useState(false);
  const [rxForm, setRxForm] = useState({
    appointmentId: "",
    patientId: "",
    patientName: "",
    patientAge: "",
    patientEmail: "",
    diagnosis: "",
    drugs: [{ name: "", dose: "", frequency: "", duration: "" }],
    notes: "",
  });
  const [rxSaving, setRxSaving] = useState(false);

  // Patients
  const [patientSearch, setPatientSearch] = useState("");

  // Video consultations
  const [vcRequests, setVcRequests] = useState([]);
  const [vcLoading, setVcLoading] = useState(true);
  const [vcFilter, setVcFilter] = useState("All");

  // AI
  
  const [aiSymptoms, setAiSymptoms] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiInputValid, setAiInputValid] = useState(false);
  const [aiMessages, setAiMessages] = useState([
  {
    from: "ai",
    text: "Good afternoon, Doctor. I'm here with you—no rush. You can ask me anything, whether it's about a patient or just something quick. I'm listening.",
  },
]);
  const [aiInput,        setAiInput]        = useState("");
  const [saraTextInput,  setSaraTextInput]  = useState("");
  const [saraTextOpen,   setSaraTextOpen]   = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    phone: "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Helpers ─
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const toggleVoice = () => {
    if (!browserSupportsSpeechRecognition) {
      showToast(
        "🎙️ Voice input only works on Chrome. Please use Chrome browser.",
        "error",
      );
      return;
    }

    if (isListening) {
      // Stop
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    // Start fresh recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true; 
    recog.lang = "en-IN";

    const savedNotes = rxForm.notes; 

    recog.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text + " ";
        } else {
          interim += text;
        }
      }

      // Show interim in real-time, commit final
      baseNotesRef.current = baseNotesRef.current + final;

      setRxForm((f) => ({
        ...f,
        notes: savedNotes
          ? savedNotes + " " + baseNotesRef.current + interim
          : baseNotesRef.current + interim,
      }));
    };

    recog.onerror = (e) => {
      console.error("Speech error:", e.error);
      if (e.error === "not-allowed") {
        showToast("Microphone access denied.", "error");
        recognitionRef.current = null;
        setIsListening(false);
      } else if (e.error === "network") {
        showToast("Network error — check your connection.", "error");
        recognitionRef.current = null;
        setIsListening(false);
      } else if (e.error === "aborted") {
        
      }
    };

    recog.onend = () => {
      // Only restart if still supposed to be listening AND no error
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log("Restart failed:", e);
        }
      }
    };

    baseNotesRef.current = ""; 
    recog.start();
    recognitionRef.current = recog;
    setIsListening(true);
  };
  const docFirst = doctor?.firstName || profile.firstName || "Doctor";
  const docLast = doctor?.lastName || profile.lastName || "";
  const docDept = doctor?.doctorDepartment || profile.department || "";
  const docInitials = `${docFirst[0] || "D"}${docLast[0] || ""}`.toUpperCase();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Derived stats 
  const pendingAppts = appointments.filter(
    (a) => a.status === "Pending",
  ).length;
  const confirmedAppts = appointments.filter((a) =>
    ["Confirmed", "Accepted"].includes(a.status),
  ).length;
  const completedAppts = appointments.filter(
    (a) => a.status === "Completed",
  ).length;
  const todayAppts = appointments.filter((a) => isToday(a.appointment_date));
  const pendingVC    = vcRequests.filter((r) => r.status === "Pending").length;
  const acceptedVC   = vcRequests.filter((r) => r.status === "Accepted").length;
  const actionableVC = pendingVC + acceptedVC;
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const filteredAppts =
    apptFilter === "All"
      ? appointments
      : appointments.filter((a) => a.status === apptFilter);

  const uniquePatients = (() => {
    const map = new Map();
    appointments.forEach((a) => {
      const k = String(a.patientId);
      const existing = map.get(k);
      if (!existing || new Date(a.appointment_date) > new Date(existing.appointment_date)) {
        map.set(k, a);
      }
    });
    return Array.from(map.values()).map((a) => ({
      id: a.patientId,
      name: `${a.firstName || ""} ${a.lastName || ""}`.trim(),
      email: a.email || "",
      dept: a.department || "General",
      lastVisit: fmtDate(a.appointment_date),
      initials: `${a.firstName?.[0] || "?"}${a.lastName?.[0] || "?"}`.toUpperCase(),
    }));
  })();

  const filteredPatients = uniquePatients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.dept.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(patientSearch.toLowerCase()),
  );

  // Seed profile 
  useEffect(() => {
    if (doctor?.firstName) {
      setProfile({
        firstName: doctor.firstName || "",
        lastName: doctor.lastName || "",
        email: doctor.email || "",
        department: doctor.doctorDepartment || "",
        phone: doctor.phone || "",
        bio: doctor.bio || "",
      });
    }
  }, [doctor]);
  //  New video request notification
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = ({ consultation, message }) => {
      console.log("🔔 new-video-request received!");
      showToast(`📹 ${message}`);
      setVcRequests((prev) => [consultation, ...prev]);
      setNotifications((prev) => [
        {
          id: consultation._id,
          type: "video",
          text: message,
          time: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
      try { const a = new Audio("/notification.mp3"); a.volume = 0.6; a.play().catch(() => {}); } catch (_) {} 
    };
    socket.on("new-video-request", handler);
    return () => socket.off("new-video-request", handler);
  }, [socketRef.current]);

  // Fetch functions 
  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setApptLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await axios.get(
        `${BASE}/api/v1/appointment/doctor/mine`,
        { withCredentials: true },
      );
      setAppointments(data.appointments || []);
      setNotifications((prev) => {
        const rtNotifs = prev.filter((n) => n.type === "video");
        return [...(data.notifications || []), ...rtNotifs];
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        showToast("Session expired", "error");
        setIsDoctorAuthenticated(false);
        navigate("/login");
      } else
        showToast(
          err.response?.data?.message || "Failed to load appointments",
          "error",
        );
    } finally {
      setApptLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchRxHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BASE}/api/v1/prescription/mine`, {
        withCredentials: true,
      });
      setRxHistory(data.prescriptions || []);
    } catch {}
  }, []);

  const fetchVcRequests = useCallback(async () => {
    setVcLoading(true);
    try {
      const { data } = await axios.get(
        `${BASE}/api/v1/videoconsult/doctor/mine`,
        { withCredentials: true },
      );
      setVcRequests(data.consultations || []);
    } catch {
    } finally {
      setVcLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchRxHistory();
    fetchVcRequests();
    setTimeout(() => setHeroVis(true), 80);
    const iv = setInterval(() => fetchAppointments(true), 30_000);
    return () => clearInterval(iv);
  }, [fetchAppointments, fetchRxHistory, fetchVcRequests]);

  // refs hoisted — recognitionRef was used in toggleVoice before previous declaration

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);
// Sara wake-word listener placeholder (no-op — activation is manual via button)
const startWakeWordRef = useRef(null);
useEffect(() => {
  startWakeWordRef.current = () => {};
}, []);

  //  Appointment actions 
  const updateApptStatus = async (id, status) => {
    try {
      await axios.put(
        `${BASE}/api/v1/appointment/doctor/update/${id}`,
        { status },
        { withCredentials: true },
      );
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a)),
      );
      setNotifications((prev) =>
        prev.filter((n) => String(n.id) !== String(id)),
      );
      showToast(`Appointment ${status.toLowerCase()} successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update", "error");
    }
  };

  const openRxFor = (appt) => {
    setRxForm((f) => ({
      ...f,
      appointmentId: appt._id,
      patientId: appt.patientId || "",
      patientName: `${appt.firstName} ${appt.lastName}`,
      patientEmail: appt.email || "",
    }));
    setActiveTab("prescription");
    showToast(`Prescription opened for ${appt.firstName} ${appt.lastName}`);
  };

  //  Replace acceptVC function 
  const acceptVC = async (id) => {
    try {
      await axios.put(
        `${BASE}/api/v1/videoconsult/${id}/accept`,
        {},
        { withCredentials: true },
      );
      setVcRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "Accepted" } : r)),
      );

      showToast("Video consultation accepted — patient notified ✅");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to accept", "error");
    }
  };

  const rejectVC = async (id) => {
    try {
      await axios.put(
        `${BASE}/api/v1/videoconsult/${id}/reject`,
        {},
        { withCredentials: true },
      );
      setVcRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "Rejected" } : r)),
      );
      showToast("Video consultation rejected");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject", "error");
    }
  };

  //  startVideoCall function 
  const startVideoCall = async (vc) => {
    try {

      // Use the API to start the call  roomId comes from DB, NOT generated here
      const { data } = await axios.put(
        `${BASE}/api/v1/videoconsult/${vc._id}/start`,
        {},
        { withCredentials: true },
      );
      const roomId = data.roomId;

      // Navigate doctor to the video page using the SAME roomId patient will use
      navigate(`/video/${roomId}`);
      showToast("🎥 Starting video call…");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to start call", "error");
    }
  };
  //  Prescription 
  const addDrug = () =>
    setRxForm((f) => ({
      ...f,
      drugs: [...f.drugs, { name: "", dose: "", frequency: "", duration: "" }],
    }));
  const removeDrug = (i) =>
    setRxForm((f) => ({ ...f, drugs: f.drugs.filter((_, idx) => idx !== i) }));
  const updateDrug = (i, field, val) =>
    setRxForm((f) => {
      const d = [...f.drugs];
      d[i] = { ...d[i], [field]: val };
      return { ...f, drugs: d };
    });

  const saveRx = async () => {
    if (!rxForm.patientName || !rxForm.diagnosis || !rxForm.drugs[0]?.name) {
      showToast("Fill patient name, diagnosis and at least one drug", "error");
      return;
    }
    setRxSaving(true);
    try {
      await axios.post(
        `${BASE}/api/v1/prescription/create`,
        {
          appointmentId: rxForm.appointmentId || undefined,
          patientId: rxForm.patientId || undefined,
          patientName: rxForm.patientName,
          patientAge: rxForm.patientAge,
          patientEmail: rxForm.patientEmail,
          diagnosis: rxForm.diagnosis,
          drugs: rxForm.drugs,
          notes: rxForm.notes,
        },
        { withCredentials: true },
      );
      showToast("✅ Prescription saved — patient notified");
      setRxForm({
        appointmentId: "",
        patientId: "",
        patientName: "",
        patientAge: "",
        patientEmail: "",
        diagnosis: "",
        drugs: [{ name: "", dose: "", frequency: "", duration: "" }],
        notes: "",
      });
      fetchRxHistory();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setRxSaving(false);
    }
  };

  const deleteRx = async (id) => {
    setRxDeleting(true);
    try {
      await axios.delete(`${BASE}/api/v1/prescription/${id}`, { withCredentials: true });
      setRxHistory(prev => prev.filter(r => r._id !== id));
      setRxDeleteConfirm(null);
      showToast("Prescription deleted");
      await fetchAppointments(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete", "error");
    } finally {
      setRxDeleting(false);
    }
  };

  const openRxEdit = (rx) => {
    setRxEditId(rx._id);
    setRxEditMode(true);
    setRxForm({
      appointmentId: rx.appointmentId || "",
      patientId: rx.patientId || "",
      patientName: rx.patientName || "",
      patientAge: rx.patientAge || "",
      patientEmail: rx.patientEmail || "",
      diagnosis: rx.diagnosis || "",
      drugs: rx.drugs?.length ? rx.drugs : [{ name: "", dose: "", frequency: "", duration: "" }],
      notes: rx.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Editing prescription for ${rx.patientName}`);
  };

  const saveRxEdit = async () => {
    if (!rxForm.patientName || !rxForm.diagnosis || !rxForm.drugs[0]?.name) {
      showToast("Fill patient name, diagnosis and at least one drug", "error");
      return;
    }
    setRxSaving(true);
    try {
      await axios.put(
        `${BASE}/api/v1/prescription/${rxEditId}`,
        {
          patientName: rxForm.patientName,
          patientAge: rxForm.patientAge,
          patientEmail: rxForm.patientEmail,
          diagnosis: rxForm.diagnosis,
          drugs: rxForm.drugs,
          notes: rxForm.notes,
        },
        { withCredentials: true }
      );
      showToast("✅ Prescription updated successfully");
      setRxEditMode(false);
      setRxEditId(null);
      setRxForm({
        appointmentId: "", patientId: "", patientName: "", patientAge: "",
        patientEmail: "", diagnosis: "",
        drugs: [{ name: "", dose: "", frequency: "", duration: "" }], notes: "",
      });
      fetchRxHistory();
      await fetchAppointments(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update", "error");
    } finally {
      setRxSaving(false);
    }
  };

  // AI
  const SYMPTOM_KEYWORDS = [
    "pain",
    "ache",
    "aching",
    "sore",
    "hurt",
    "tender",
    "cramp",
    "burning",
    "throbbing",
    "pressure",
    "discomfort",
    "fever",
    "temperature",
    "chills",
    "sweating",
    "sweats",
    "flushed",
    "shivering",
    "cough",
    "coughing",
    "breathless",
    "shortness of breath",
    "wheeze",
    "chest tightness",
    "mucus",
    "phlegm",
    "sputum",
    "runny nose",
    "congestion",
    "hoarse",
    "nausea",
    "vomiting",
    "vomit",
    "diarrhea",
    "diarrhoea",
    "constipation",
    "bloating",
    "stomach",
    "abdomen",
    "abdominal",
    "heartburn",
    "reflux",
    "appetite",
    "weight loss",
    "headache",
    "migraine",
    "dizziness",
    "dizzy",
    "lightheaded",
    "vertigo",
    "confusion",
    "seizure",
    "fainting",
    "tremor",
    "numbness",
    "tingling",
    "weakness",
    "rash",
    "itching",
    "itchy",
    "swelling",
    "swollen",
    "redness",
    "blister",
    "hives",
    "jaundice",
    "palpitation",
    "palpitations",
    "edema",
    "swollen legs",
    "blurred vision",
    "eye pain",
    "ear pain",
    "tinnitus",
    "sore throat",
    "swallowing",
    "urination",
    "urinary",
    "dysuria",
    "blood in urine",
    "kidney",
    "joint",
    "stiffness",
    "muscle",
    "back pain",
    "neck pain",
    "shoulder pain",
    "knee pain",
    "fatigue",
    "tired",
    "tiredness",
    "lethargy",
    "malaise",
    "bleeding",
    "discharge",
    "infection",
    "for days",
    "for weeks",
    "for hours",
    "since",
    "started",
    "worsening",
    "getting worse",
    "chronic",
    "acute",
    "sudden",
    "intermittent",
    "constant",
    "recurrent",
  ];
  const INVALID_PATTERNS = [
    /^(hi|hello|hey|test|testing|ok|okay|yes|no|lol|bye|thanks|thank you|help|what|why|how|who)[\s!?.]*$/i,
    /^[^a-zA-Z]*$/,
  ];
  const validateAiInput = (text) => {
    const t = text.trim();
    if (t.length < 15) return false;
    if (!/[a-zA-Z]{3,}/.test(t)) return false;
    for (const p of INVALID_PATTERNS) if (p.test(t)) return false;
    return SYMPTOM_KEYWORDS.some((kw) => t.toLowerCase().includes(kw));
  };
  const handleAiSymptomsChange = (e) => {
    const val = e.target.value.slice(0, 600);
    setAiSymptoms(val);
    setAiResult(null);
    setAiError("");
    setAiInputValid(validateAiInput(val));
  };
  const fillSuggestion = (text) => {
    setAiSymptoms(text);
    setAiResult(null);
    setAiError("");
    setAiInputValid(validateAiInput(text));
  };
  const analyseSymptoms = async () => {
    const trimmed = aiSymptoms.trim();
    if (!aiInputValid || !trimmed) {
      setAiError(
        "Please enter valid symptoms. Try: 'fever and cough for 2 days'.",
      );
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    setAiError("");
    try {
      const { data } = await axios.post(
        `${BASE}/api/v1/ai/analyse`,
        { symptoms: trimmed },
        { withCredentials: true },
      );
      if (data.success && data.result) {
        setAiResult({
          urgency: data.result.urgency || "Routine",
          urgencyColor: data.result.urgencyColor || "#f59e0b",
          conditions: (data.result.possibleConditions || []).map((c) => ({
            name: c.name,
            likelihood: c.likelihood,
            icd10: c.icd10,
          })),
          redFlags: data.result.redFlags || [],
          tests: data.result.recommendedTests || [],
          management: data.result.initialManagement || "",
        });
      } else {
        setAiError(data.message || "Analysis failed. Please try again.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to connect to AI.";
      setAiError(msg);
      if (err.response?.data?.type !== "INVALID_SYMPTOMS")
        showToast(msg, "error");
    } finally {
      setAiLoading(false);
    }
  };
  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const question = aiInput.trim().slice(0, 400);
    setAiMessages((m) => [...m, { from: "doctor", text: question }]);
    setAiInput("");
    const thinkingTexts = [
  "Just a moment, Doctor…",
  "Let me check that for you…",
  "Thinking…",
  "One second…",
];

setAiMessages((m) => [
  ...m,
  {
    from: "ai",
    text: thinkingTexts[Math.floor(Math.random() * thinkingTexts.length)],
  },
]);
    try {
      const { data } = await axios.post(
        `${BASE}/api/v1/ai/chat`,
        { question },
        { withCredentials: true },
      );
      setAiMessages((m) => [
        ...m.slice(0, -1), 
        {
          from: "ai",
          text: data.answer || "Sorry, I could not get a response.",
        },
      ]);
    } catch (err) {
      setAiMessages((m) => [
        ...m.slice(0, -1),
        { from: "ai", text: "❌ Failed to connect to AI. Please try again." },
      ]);
    }
  };
  // Profile 
  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      await axios.put(`${BASE}/api/v1/user/profile/update/doctor`, profile, {
        withCredentials: true,
      });
      setDoctor(prev => ({
        ...prev,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        doctorDepartment: profile.department,
        bio: profile.bio,
      }));
      showToast("Profile updated successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  //  Logout 
  const handleLogout = async () => {
    try {
      await axios.get(`${BASE}/api/v1/user/doctor/logout`, {
        withCredentials: true,
      });
    } catch {}
    setIsDoctorAuthenticated(false);
    setDoctor({});
    navigate("/login");
  };

  // Tab config 
  const TABS = [
    { id: "overview",      label: "🏠 Overview" },
    { id: "appointments",  label: "📅 Appointments", badge: pendingAppts || null },
    { id: "patients",      label: "👥 Patients" },
    { id: "prescription",  label: "💊 Prescription" },
    { id: "videoconsult",  label: "🎥 Video Calls",  badge: pendingVC || null },
    { id: "ai",            label: "🤖 AI Assistant" },
    { id: "notifications", label: "🔔 Alerts",       badge: unreadNotifs || null },
    { id: "profile",       label: "⚙️ Profile" },
  ];










// ── VOICE ASSISTANT — Sara (Whisper + Groq LLM + TTS) ────────────────────────

const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Sara engine refs
const saraMediaRecorderRef = useRef(null);
const saraAudioChunksRef   = useRef([]);
const saraAudioPlayerRef   = useRef(null);
const saraIsRecordingRef   = useRef(false);
const saraIsPlayingRef     = useRef(false);
const saraStreamRef        = useRef(null);
const saraStartRecordingRef = useRef(null);
const saraHandleCommandRef  = useRef(null);

// ── Sara TTS: ElevenLabs/OpenAI via backend, fallback to browser speech ───────
const saraTTSSpeak = useCallback(async (text, onEnd) => {
  if (!text?.trim() || !vaActiveRef.current) { onEnd?.(); return; }
  saraIsPlayingRef.current = true;
  setVaSpeaking(true);
  window.speechSynthesis.cancel();

  const browserFallback = () => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.name === "Google UK English Female")
           || voices.find(v => v.name === "Samantha")
           || voices.find(v => v.lang === "en-GB")
           || voices.find(v => v.lang.startsWith("en"))
           || null;
    if (v) utt.voice = v;
    utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 1;
    const done = () => {
      saraIsPlayingRef.current = false;
      setVaSpeaking(false);
      setTimeout(() => onEnd?.(), 200);
    };
    utt.onend = done; utt.onerror = done;
    window.speechSynthesis.speak(utt);
  };

  try {
    const res = await axios.post(
      `${BASE}/api/v1/ai/sara/tts`,
      { text },
      { withCredentials: true, responseType: "blob", timeout: 8000 }
    );
    if (res.status === 204) { saraIsPlayingRef.current = false; setVaSpeaking(false); browserFallback(); return; }
    const url = URL.createObjectURL(res.data);
    const audio = new Audio(url);
    saraAudioPlayerRef.current = audio;
    const done = () => {
      URL.revokeObjectURL(url);
      saraIsPlayingRef.current = false;
      setVaSpeaking(false);
      saraAudioPlayerRef.current = null;
      setTimeout(() => onEnd?.(), 200);
    };
    audio.onended = done; audio.onerror = done;
    await audio.play();
  } catch (err) {
    saraIsPlayingRef.current = false;
    setVaSpeaking(false);
    browserFallback();
  }
}, []);

// ── Stop any playing audio immediately ────────────────────────────────────────
const saraStopAudio = useCallback(() => {
  if (saraAudioPlayerRef.current) {
    saraAudioPlayerRef.current.pause();
    saraAudioPlayerRef.current = null;
  }
  window.speechSynthesis.cancel();
  saraIsPlayingRef.current = false;
  setVaSpeaking(false);
}, []);

// ── Start listening after Sara finishes speaking ──────────────────────────────
const startListenAfterSpeak = useCallback(() => {
  if (!vaActiveRef.current) return;
  setTimeout(() => {
    if (vaActiveRef.current && !saraIsRecordingRef.current && !saraIsPlayingRef.current) {
      saraStartRecordingRef.current?.();
    }
  }, 1200);
}, []);




























































const saraHandleCommand = useCallback(async (text) => {
if (!vaActiveRef.current) return;
const rawCmd = text;
const lower = text.toLowerCase().trim();
const cmd = lower;

const CLINICAL_Q     = /\b(what is|what are|what'?s|tell me about|explain|describe|how (?:to treat|does|do i treat)|treatment for|management of|dose of|dosage for?|side effects? of|contraindication|drug interaction|can i (?:give|prescribe|use)|should i (?:give|prescribe)|when to (?:give|use)|indication for|mechanism of|difference between|is (?:\w+ ){0,3}safe|define|cause of|causes of|sign of|signs of|complication)\b/i;
const CLINICAL_TOPIC = /\b(antibiotic|pharmacology|anatomy|physiology|pathology|dosage|dose|mg|ml|treatment|therapy|symptom|disease|condition|infection|diabetes|hypertension|malaria|dengue|typhoid|asthma|pneumonia|tuberculosis|tb|covid|cancer|fracture|arthritis|migraine|protocol|guideline|icd|surgery|procedure|evidence|journal|indication|contraindication|interaction|side effect|adverse|toxicity|overdose|antidote|vaccine|steroid|insulin|beta.?blocker|ace inhibitor|statin|anticoagulant|antiplatelet|antihistamine|diuretic|analgesic|antipyretic|antifungal|antiviral)\b/i;
const DASHBOARD_Q    = /\b(pending|today|schedule|my appointment|my patient|notification|video call|prescription form|refresh|what time|what date|summary|status|profile)\b/i;

const isClinicalQuestion =
CLINICAL_Q.test(lower) &&
CLINICAL_TOPIC.test(lower) &&
!DASHBOARD_Q.test(lower);

if (
  /^(stop|bye|bye+\s*bye|goodbye|good\s*night|exit|sleep|turn\s*off|deactivate|shut\s*down|close)[\s!.]*$/i.test(lower) ||
  /\b(stop\s+sara|bye\s+sara|goodbye\s+sara|good\s+night\s+sara|turn\s+off\s+sara|deactivate\s+sara|sleep\s+sara|shut\s+up\s+sara)\b/i.test(lower)
) {
  // Kill mic before speaking goodbye so it cannot re-trigger
  if (vaRecogRef.current) {
    try { vaRecogRef.current.abort(); } catch (_) {}
    vaRecogRef.current = null;
  }
  isListeningLockRef.current = true;
  const goodbyeLines = [
    `Goodbye Doctor ${docFirst}. Take care and rest well.`,
    `Signing off now Doctor. See you soon.`,
    `Going quiet now Doctor ${docFirst}. I'll be here when you need me.`,
    `Understood. Goodbye Doctor. You did great today.`,
  ];
  saraTTSSpeak(goodbyeLines[Math.floor(Math.random() * goodbyeLines.length)], () => {
    isListeningLockRef.current = false;
    deactivateVoiceAssistantRef.current?.();
  });
  return;
}

const LOCAL = [
{ test: /\b(overview|home|go home|dashboard)\b/,
run: () => { setActiveTab("overview");      saraTTSSpeak("Opening overview.", startListenAfterSpeak); } },
{ test: /\b(appointment|appointments)\b/,
run: () => { setActiveTab("appointments");  saraTTSSpeak("Opening appointments.", startListenAfterSpeak); } },
{ test: /\b(patient|patients)\b/,
run: () => { setActiveTab("patients");      saraTTSSpeak("Opening patients.", startListenAfterSpeak); } },
{ test: /\b(prescription|prescribe|rx)\b/,
run: () => { setActiveTab("prescription");  saraTTSSpeak("Opening prescription.", startListenAfterSpeak); } },
{ test: /\b(video|video call|video calls|consult)\b/,
run: () => { setActiveTab("videoconsult");  saraTTSSpeak("Opening video calls.", startListenAfterSpeak); } },
{ test: /\b(notification|notifications|alert|alerts)\b/,
run: () => { setActiveTab("notifications"); saraTTSSpeak("Opening notifications.", startListenAfterSpeak); } },
{ test: /\b(profile|settings|setting)\b/,
run: () => { setActiveTab("profile");       saraTTSSpeak("Opening profile.", startListenAfterSpeak); } },
{ test: /\b(refresh|reload|sync|update data)\b/,
run: async () => {
saraTTSSpeak("Refreshing now.", async () => {
await Promise.all([fetchAppointments(true), fetchVcRequests()]);
saraTTSSpeak(`All refreshed. ${pendingAppts > 0 ? `${pendingAppts} appointments pending.` : "Everything is up to date."}`, startListenAfterSpeak);
});
}},
{ test: /\b(what.*time|time is it|current time|tell.*time)\b/,
run: () => {
const t = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
saraTTSSpeak(`It is ${t} Indian Standard Time.`, startListenAfterSpeak);
}},
{ test: /\b(what.*date|today.*date|what day|which day|day is it)\b/,
run: () => {
const d = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
saraTTSSpeak(`Today is ${d}.`, startListenAfterSpeak);
}},
{ test: /\b(how are you|you okay|you alright|how r you)\b/,
run: () => saraTTSSpeak(`I am doing wonderfully Doctor ${docFirst}, thank you for asking. What can I help you with?`, startListenAfterSpeak)},
{ test: /\b(summary|status|brief me|update me|what.*pending)\b/,
run: () => saraTTSSpeak(`Quick summary Doctor. ${todayAppts.length} patients today. ${pendingAppts} pending. ${pendingVC} video requests. ${unreadNotifs} unread alerts.`,
startListenAfterSpeak)},
{ test: /\b(mark all read|clear notification|dismiss all)\b/,
run: () => {
setNotifications(prev => prev.map(n => ({ ...n, read: true })));
saraTTSSpeak("All notifications marked as read.", startListenAfterSpeak);
}},
{ test: /\b(accept).*(appointment)\b|\b(approve).*(appointment)\b/,
run: async () => {
const latest = appointments.find(a => a.status === "Pending");
if (!latest) { saraTTSSpeak("No pending appointments right now.", startListenAfterSpeak); return; }
await updateApptStatus(latest._id, "Accepted");
saraTTSSpeak(`Appointment accepted for ${latest.firstName} ${latest.lastName}.`, startListenAfterSpeak);
}},
{ test: /\b(reject|decline).*(appointment)\b/,
run: async () => {
const latest = appointments.find(a => a.status === "Pending");
if (!latest) { saraTTSSpeak("No pending appointments.", startListenAfterSpeak); return; }
await updateApptStatus(latest._id, "Rejected");
saraTTSSpeak("Appointment rejected.", startListenAfterSpeak);
}},
{ test: /\b(accept).*(video|call)\b|\b(approve).*(video|call)\b/,
run: async () => {
const latest = vcRequests.find(r => r.status === "Pending");
if (!latest) { saraTTSSpeak("No pending video calls.", startListenAfterSpeak); return; }
await acceptVC(latest._id);
saraTTSSpeak("Video call accepted. Patient has been notified.", startListenAfterSpeak);
}},
{ test: /\b(reject|decline).*(video|call)\b/,
run: async () => {
const latest = vcRequests.find(r => r.status === "Pending");
if (!latest) { saraTTSSpeak("No pending video calls.", startListenAfterSpeak); return; }
await rejectVC(latest._id);
saraTTSSpeak("Video call rejected.", startListenAfterSpeak);
}},
{ test: /\b(save).*(prescription|rx)\b|\b(save it|save now|submit prescription|save this)\b/,
run: async () => {
if (!rxForm.patientName || !rxForm.diagnosis || !rxForm.drugs[0]?.name) {
saraTTSSpeak(`Prescription incomplete. Still need ${!rxForm.patientName ? "patient name, " : ""}${!rxForm.diagnosis ? "diagnosis, " : ""}${!rxForm.drugs[0]?.name ? "drug name" : ""}.`, startListenAfterSpeak);
return;
}
saraTTSSpeak("Saving prescription now.", async () => {
try {
await axios.post(`${BASE}/api/v1/prescription/create`, {
appointmentId: rxForm.appointmentId || undefined,
patientId:     rxForm.patientId     || undefined,
patientName:   rxForm.patientName,
patientAge:    rxForm.patientAge,
patientEmail:  rxForm.patientEmail,
diagnosis:     rxForm.diagnosis,
drugs:         rxForm.drugs,
notes:         rxForm.notes,
}, { withCredentials: true });
setRxForm({ appointmentId:"", patientId:"", patientName:"", patientAge:"", patientEmail:"", diagnosis:"", drugs:[{name:"",dose:"",frequency:"",duration:""}], notes:"" });
fetchRxHistory();
saraTTSSpeak("Prescription saved. Patient has been notified.", startListenAfterSpeak);
} catch (err) {
saraTTSSpeak("Could not save prescription. Please try manually.", startListenAfterSpeak);
}
});
}},
{ test: /\b(clear|reset).*(prescription|form|rx)\b|\b(new prescription|fresh prescription)\b/,
run: () => {
setRxForm({ appointmentId:"", patientId:"", patientName:"", patientAge:"", patientEmail:"", diagnosis:"", drugs:[{name:"",dose:"",frequency:"",duration:""}], notes:"" });
saraTTSSpeak("Prescription form cleared. Ready for a new one.", startListenAfterSpeak);
}},
];

for (const { test, run } of LOCAL) {
if (test.test(lower)) { await run(); return; }
}

try {
const { data } = await axios.post(`${BASE}/api/v1/ai/sara/respond`,
{
text,
context: {
doctorName:   `${docFirst} ${docLast}`,
dept:         docDept,
todayCount:   todayAppts.length,
pending:      pendingAppts,
pendingVC,
unreadNotifs,
patientCount: uniquePatients.length,
activeTab,
rxForm: {
patientName:  rxForm.patientName,
patientAge:   rxForm.patientAge,
patientEmail: rxForm.patientEmail,
diagnosis:    rxForm.diagnosis,
drugs:        rxForm.drugs,
},
},
},
{ withCredentials: true, timeout: 10000 });

const reply = data.reply?.trim();
if (!reply) { startListenAfterSpeak(); return; }

try {
const parsed = JSON.parse(reply);
if (parsed.action === "navigate" && parsed.tab) {
setActiveTab(parsed.tab);
saraTTSSpeak(`Opening ${parsed.tab}.`, startListenAfterSpeak);
return;
}
if (parsed.action === "fill" && parsed.field && parsed.value !== undefined) {
if (parsed.field === "drugs") {
setRxForm(f => ({ ...f, drugs: [{ ...f.drugs[0], name: parsed.value }] }));
} else {
setRxForm(f => ({ ...f, [parsed.field]: parsed.value }));
}
setActiveTab("prescription");
saraTTSSpeak(`Got it. ${parsed.field} filled.`, startListenAfterSpeak);
return;
}
} catch (_) {}

saraTTSSpeak(reply, startListenAfterSpeak);
} catch (err) {
console.error("Sara LLM error:", err.message);
saraTTSSpeak("Sorry Doctor, I could not connect right now. Please try again.", startListenAfterSpeak);
}
}, [docFirst, docLast, docDept, todayAppts, pendingAppts, pendingVC, unreadNotifs,
uniquePatients, activeTab, rxForm, appointments, vcRequests,
saraTTSSpeak, startListenAfterSpeak, fetchAppointments, fetchVcRequests, 
updateApptStatus, acceptVC, rejectVC, setActiveTab, setNotifications, setRxForm, fetchRxHistory]);


// ── Record one utterance via MediaRecorder → Groq Whisper ────────────────────
const saraStartRecording = useCallback(async () => {
  if (!vaActiveRef.current) return;
  if (saraIsRecordingRef.current || saraIsPlayingRef.current) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Microphone not available", "error"); return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    saraStreamRef.current    = stream;
    saraAudioChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
                   : MediaRecorder.isTypeSupported("audio/webm")              ? "audio/webm"
                   : "audio/ogg";

    const recorder = new MediaRecorder(stream, { mimeType });
    saraMediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) saraAudioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      saraStreamRef.current      = null;
      saraIsRecordingRef.current = false;
      setVaListening(false);

      const blob = new Blob(saraAudioChunksRef.current, { type: mimeType });
      if (blob.size < 1500) {
        // Too small — likely silence, restart
        if (vaActiveRef.current && !saraIsPlayingRef.current) {
          setTimeout(() => saraStartRecordingRef.current?.(), 400);
        }
        return;
      }

      // Send to Groq Whisper
      const formData = new FormData();
      formData.append("audio", blob, "sara_input.webm");
      try {
        const { data } = await axios.post(
          `${BASE}/api/v1/ai/sara/transcribe`,
          formData,
          { withCredentials: true, headers: { "Content-Type": "multipart/form-data" }, timeout: 15000 }
        );
        const text = data.text?.trim();
        if (!text || text.length < 2) {
          if (vaActiveRef.current && !saraIsPlayingRef.current) {
            setTimeout(() => saraStartRecordingRef.current?.(), 400);
          }
          return;
        }
        showToast(`🎙️ "${text}"`);
        if (vaActiveRef.current) saraHandleCommandRef.current?.(text);
      } catch (err) {
        if (vaActiveRef.current && !saraIsPlayingRef.current) {
          setTimeout(() => saraStartRecordingRef.current?.(), 1000);
        }
      }
    };

    recorder.start();
    saraIsRecordingRef.current = true;
    setVaListening(true);

    // Auto-stop after 7 seconds max — prevents forever-open mic
    setTimeout(() => {
      if (saraMediaRecorderRef.current?.state === "recording") {
        saraMediaRecorderRef.current.stop();
      }
    }, 7000);

  } catch (err) {
    console.error("Mic error:", err.message);
    showToast("Microphone access denied.", "error");
    deactivateVoiceAssistantRef.current?.();
  }
}, []);

useEffect(() => {
  const invalidate = () => {
    voiceCacheRef.current = { voice: null, lang: navigator.language };
  };
  window.speechSynthesis.addEventListener?.("voiceschanged", invalidate);
  return () => {
    window.speechSynthesis.removeEventListener?.("voiceschanged", invalidate);
  };
}, []);
const getVoice = () => {
  const currentLang = navigator.language;
  if (voiceCacheRef.current.lang !== currentLang) {
    voiceCacheRef.current = { voice: null, lang: currentLang };
  }
  if (voiceCacheRef.current.voice) return voiceCacheRef.current.voice;
  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find(v => v.name === "Google UK English Female") ||
    voices.find(v => v.name === "Samantha") ||
    voices.find(v => v.name === "Karen")    ||
    voices.find(v => v.name === "Moira")    ||
    voices.find(v => v.name === "Tessa")    ||
    voices.find(v => v.lang === "en-GB")    ||
    voices.find(v => v.lang === "en-AU")    ||
    voices.find(v => v.lang.startsWith("en")) ||
    null;
  voiceCacheRef.current.voice = match;
  return match;
};

const stopInterruptMic = () => {
  if (interruptRecogRef.current) {
    try { interruptRecogRef.current.stop(); } catch (_) {}
    interruptRecogRef.current = null;
  }
};

// ── 1. speak — must come first, everything else calls it ──
const speak = (text, onEnd) => {
  if (vaRecogRef.current) {
    try { vaRecogRef.current.stop(); } catch (_) {}
    vaRecogRef.current = null;
  }
  isListeningLockRef.current = false;
  window.speechSynthesis.cancel();

  if (speakWatchdogRef.current) {
    clearInterval(speakWatchdogRef.current);
    speakWatchdogRef.current = null;
  }

  setVaSpeaking(true);
  // Block mic from restarting for the full expected duration + buffer
  // Only block for 1 second initially — utt.onend will reset it to 800ms when done
  speakingBlockUntilRef.current = Date.now() + 3000;

  const utt = new SpeechSynthesisUtterance(text);
  const v = getVoice();
  if (v) utt.voice = v;
  utt.rate   = 0.88;
  utt.pitch  = 1.02;
  utt.volume = 1;
  // Watchdog — resumes if Chrome silently pauses synthesis
  let watchdogStarted = Date.now();
  speakWatchdogRef.current = setInterval(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      return;
    }
    // If synthesis finished without firing onend (Chrome bug), clean up manually
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      clearInterval(speakWatchdogRef.current);
      speakWatchdogRef.current = null;
      // Only trigger cleanup if onend hasn't already fired
      if (Date.now() - watchdogStarted > 800) {
        setVaSpeaking(false);
        speakingBlockUntilRef.current = 0;
        setTimeout(() => {
          if (vaActiveRef.current && !vaRecogRef.current && !isListeningLockRef.current) {
            startContinuousListeningRef.current?.();
          }
        }, 400);
      }
    }
  }, 1200);

  utt.onend = () => {
    if (speakWatchdogRef.current) {
      clearInterval(speakWatchdogRef.current);
      speakWatchdogRef.current = null;
    }
    window.speechSynthesis.cancel();
    setVaSpeaking(false);
    // Keep mic blocked for 1.5s after speech ends — prevents echo of Sara's own voice
    speakingBlockUntilRef.current = Date.now() + 1500;
    setTimeout(() => onEnd?.(), 600);
  };
  utt.onerror = (e) => {
    // "interrupted" is NOT a real error — it means the doctor spoke
    // over Sara intentionally. Treat it the same as onend.
    if (speakWatchdogRef.current) {
      clearInterval(speakWatchdogRef.current);
      speakWatchdogRef.current = null;
    }
    window.speechSynthesis.cancel();
    setVaSpeaking(false);
    speakingBlockUntilRef.current = Date.now() + (e.error === "interrupted" ? 400 : 800);
    setTimeout(() => onEnd?.(), e.error === "interrupted" ? 100 : 200);
  };

  window.speechSynthesis.speak(utt);
};

// ── 2. deactivateVoiceAssistant ──
const deactivateVoiceAssistant = () => {
  if (speakWatchdogRef.current) {
    clearInterval(speakWatchdogRef.current);
    speakWatchdogRef.current = null;
  }
  rxFlowRef.current          = null;
  vaActiveRef.current        = false;
  interruptRef.current       = false;
  hasSpokeRef.current        = false;
  isListeningLockRef.current = false;
  window.speechSynthesis.cancel();
  stopInterruptMic();
  if (vaRecogRef.current) {
    try { vaRecogRef.current.stop(); } catch (_) {}
    vaRecogRef.current = null;
  }
  if (wakeWordRef.current) {
    try { wakeWordRef.current.stop(); } catch (_) {}
    wakeWordRef.current = null;
  }
  if (speakAbortRef.current) {
    try { speakAbortRef.current.stop(); } catch (_) {}
    speakAbortRef.current = null;
  }
  micRetryCountRef.current = 0;
  setVoiceActive(false);
  setVaListening(false);
  setVaSpeaking(false);
};

// ── 3. startContinuousListening ──
const KNOWN_KEYWORDS = [
  "accept","reject","overview","appointment","appointments","patient","patients",
  "prescription","prescribe","medicine","rx","video","call","calls","consult","notification",
  "notifications","alert","alerts","profile","setting","settings","today","summary",
  "refresh","reload","update","start","stop","bye","goodbye","exit","sleep",
  "turn off","close","deactivate","how are you","thank you","thanks","sara",
  "help","morning","night","evening","tired","exhausted","stressed","name",
  "who are you","introduce","yourself","joke","funny","laugh","love","amazing",
  "awesome","great","brilliant","fantastic","superb","adore","miss","best",
  "proud","smart","good girl","well done","schedule","task","what do i have",
  "brief","status","approve","decline","begin","join","capabilities",
  "drug","tablet","capsule","diagnosis","diagnosed","suffering","medication",
  "write","dose","mg","frequency","duration","daily","patient name","disease",
  "save prescription","save rx","save it","submit","complete appointment",
  "cancel appointment","mark complete","mark all read","clear notifications",
  "search patient","find patient","filter pending","filter accepted","filter completed",
  "analyse","analyze","symptom check","save profile","update profile",
  "clear prescription","reset form","new prescription","fresh",
  "remind me","reminder","set reminder","set alarm",
];

const scoreAlternative = (text) =>
  KNOWN_KEYWORDS.filter(kw => text.includes(kw)).length;

const bestAlternative = (result) => {
  // Always use highest-confidence result (index 0) — it is the most accurate.
  // Only override if a lower-ranked alternative has a significantly better keyword score
  // AND the top result has very low confidence.
  const top = result[0];
  const topText = top.transcript.toLowerCase().trim();
  const topConf = top.confidence || 0.85;

  // If top confidence is decent, trust it completely
  if (topConf >= 0.72) return topText;

  // Low-confidence top — check if an alternative scores much better on keywords
  let bestAlt = topText, bestScore = scoreAlternative(topText);
  for (let i = 1; i < result.length; i++) {
    const t = result[i].transcript.toLowerCase().trim();
    const s = scoreAlternative(t);
    // Only override if score is significantly higher AND confidence is not terrible
    if (s > bestScore + 1 && (result[i].confidence || 0) >= 0.55) {
      bestScore = s; bestAlt = t;
    }
  }
  return bestAlt || topText;
};

const startContinuousListening = () => {
  if (!vaActiveRef.current)         return;
  if (vaRecogRef.current)           return;
  if (isListeningLockRef.current)   return;
  const msUntilSafe = speakingBlockUntilRef.current - Date.now();
  if (msUntilSafe > 0) {
    setTimeout(() => startContinuousListeningRef.current?.(), msUntilSafe + 300);
    return;
  }
  const msSafe = speakingBlockUntilRef.current - Date.now();
  if (msSafe > 0 || window.speechSynthesis.speaking) {
    const wait = Math.max(msSafe, 0) + 400;
    setTimeout(() => startContinuousListeningRef.current?.(), wait);
    return;
  }
  const SR2 = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR2) return;

  isListeningLockRef.current = true;
  const recog           = new SR2();
  recog.lang            = "en-IN";
  recog.interimResults  = false;
  recog.maxAlternatives = IS_IOS ? 1 : 5;
  recog.continuous      = !IS_IOS;

  recog.onstart = () => {
    micRetryCountRef.current = 0;
    setVaListening(true);
  };

  recog.onresult = (e) => {
    const result = e.results[e.results.length - 1];
    if (!result.isFinal) return;

    // ── Doctor spoke → immediately cancel Sara's speech and unblock mic ──
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      setVaSpeaking(false);
    }
    speakingBlockUntilRef.current = 0;

    if (Date.now() - stepTransitionRef.current < 300) return;

    const cmd = bestAlternative(result);
    if (!cmd) {
      if (rxFlowRef.current) reAskCurrentFlowStep();
      return;
    }
    showToast(`🎙️ "${cmd}"`);
    if (vaActiveRef.current) handleVoiceCommandRef.current?.(cmd);
  };

  recog.onerror = (e) => {
    setVaListening(false);
    vaRecogRef.current         = null;
    isListeningLockRef.current = false;
    if (e.error === "not-allowed") {
      showToast("Microphone access denied.", "error");
      deactivateVoiceAssistant();
      return;
    }
    if (["service-not-allowed", "audio-capture"].includes(e.error)) {
      showToast(`🎙️ Microphone error: ${e.error}`, "error");
      deactivateVoiceAssistant();
      return;
    }
    if (e.error === "network") {
      isListeningLockRef.current = false;
      vaRecogRef.current = null;
      micRetryCountRef.current = Math.max(0, micRetryCountRef.current - 1);
      setTimeout(() => {
        if (vaActiveRef.current && !isListeningLockRef.current) {
          startContinuousListeningRef.current?.();
        }
      }, 2000);
      return;
    }
    // "aborted" = Chrome killed the mic too fast — not a real error, reset and retry silently
    if (e.error === "aborted") {
      isListeningLockRef.current = false;
      vaRecogRef.current = null;
      micRetryCountRef.current = 0;
      setTimeout(() => {
        if (vaActiveRef.current && !isListeningLockRef.current) {
          startContinuousListeningRef.current?.();
        }
      }, 1500);
      return;
    }
    micRetryCountRef.current += 1;
    if (micRetryCountRef.current >= MIC_RETRY_LIMIT) {
      showToast("Sara's microphone stopped responding. Please reactivate.", "error");
      deactivateVoiceAssistant();
      return;
    }
    const backoff = Math.min(3000 * 2 ** (micRetryCountRef.current - 1), 30000);
    if (vaActiveRef.current) {
      setTimeout(() => startContinuousListeningRef.current?.(), backoff);
    }
  };

  recog.onend = () => {
    setVaListening(false);
    vaRecogRef.current         = null;
    isListeningLockRef.current = false;
    if (!vaActiveRef.current) {
      return;
    }
    const delay = IS_IOS ? 1200 : 1800;
    setTimeout(() => {
      if (!vaActiveRef.current) return;
      const msSafe = speakingBlockUntilRef.current - Date.now();
      if (msSafe > 0) {
        setTimeout(() => startContinuousListeningRef.current?.(), msSafe + 500);
        return;
      }
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        setTimeout(() => startContinuousListeningRef.current?.(), 1200);
        return;
      }
      if (!vaRecogRef.current && !isListeningLockRef.current) {
        startContinuousListeningRef.current?.();
      }
    }, delay);
  };

  try {
    vaRecogRef.current = recog;
    recog.start();
  } catch (err) {
    vaRecogRef.current         = null;
    isListeningLockRef.current = false;
    micRetryCountRef.current  += 1;
    if (micRetryCountRef.current >= MIC_RETRY_LIMIT) {
      showToast("Sara could not start the microphone. Please reactivate.", "error");
      deactivateVoiceAssistant();
      return;
    }
    if (vaActiveRef.current) {
      setTimeout(() => startContinuousListeningRef.current?.(), 1000);
    }
  }
};

const startVAListening = () => {};


// ── Re-ask current flow step if silence ──
const reAskCurrentFlowStep = () => {
  const flow = rxFlowRef.current;
  if (!flow) return;
  // Cooldown — don't re-ask more than once every 6 seconds
  if (rxReAskTimerRef.current && Date.now() < rxReAskTimerRef.current) return;
  rxReAskTimerRef.current = Date.now() + 6000;
  const questions = {
    name:      "I did not catch that. What is the patient's full name?",
    email:     "Sorry, I missed that. What is the patient's email? Say skip if you don't have it.",
    age:       "Sorry, I missed that. How old is the patient?",
    diagnosis: "I did not hear the diagnosis. What is the patient's diagnosis?",
    drug:      "Could you repeat that? What drug should I prescribe?",
    dose:      "I missed that. What is the dose? For example, 500 milligrams. Say skip to skip.",
    frequency: "I missed that. What is the frequency? For example, once daily.",
    duration:  "Sorry. For how many days should the patient take this?",
  };
  const q = questions[flow.step];
  if (q) {
    speak(q, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
  }
};
// ── Conversational Rx Flow ──
const handleRxFlowAnswer = (answer) => {
  const flow = rxFlowRef.current;
  if (!flow) return;

  const raw   = answer.trim();
  const lower = raw.toLowerCase();

  // ── STOP/BYE — always exits even inside rx flow, checked BEFORE anything else ──
  if (/^(stop|bye|bye bye|goodbye|good night|exit|sleep|stop sara|bye sara|goodbye sara|deactivate sara|turn off sara|sleep sara)[\s!.]*$/i.test(lower)) {
    rxFlowRef.current = null;
    speak(`Prescription paused. Goodbye Doctor ${docFirst}. Take care.`, () => deactivateVoiceAssistant());
    return;
  }

  // ── Navigation intercept — fires in EVERY flow step ──
  // Only triggers for short commands (≤4 words) or explicit nav verbs
  const _navVerb  = /\b(go to|open|show me?|navigate|switch to|take me to)\b/i.test(lower);
  const _navShort = lower.trim().split(/\s+/).length <= 4;
  const _NAV_MAP = [
    [/\b(overview|go home|home screen|dashboard)\b/,       "overview"],
    [/\b(video calls?|video consult(?:ations?)?)\b/,        "videoconsult"],
    [/\bappointments?\b/,                                   "appointments"],
    [/\bpatients?\s*(?:tab|page|section)?\b/,               "patients"],
    [/\b(notifications?|alerts?)\b/,                        "notifications"],
    [/\b(profile|settings?)\b/,                             "profile"],
    [/\b(ai|symptom\s*check|clinical)\b/,                   "ai"],
  ];
  if (_navVerb || _navShort) {
    for (const [re, tab] of _NAV_MAP) {
      if (re.test(lower)) {
        setActiveTab(tab);
        speak(
          `Opening ${tab === "videoconsult" ? "video calls" : tab}. Your prescription is paused — just come back when you are ready.`,
          () => setTimeout(() => startContinuousListeningRef.current?.(), 800)
        );
        return;
      }
    }
  }

  // ── Universal skip ──
  const isSkip = /^(skip|next|no|none|blank|leave it|don't know|not sure|pass)$/i.test(lower);

  // ── Universal correction — "no X", "not X, it's Y", "wrong, Y", "i said Y", "change to Y" ──
  const isCorrecting =
    /^(no+[,.]?\s+(?!problem|worries)|nope[,.]?\s+|wrong[,.]?\s+|not\s+\w+[,.]?\s+(?:it'?s?\s+)?|i said\s+|change\s+(?:it\s+)?to\s+|it should be\s+|correct(?:ion)?\s+(?:it\s+)?to\s+|actually[,.]?\s+|i meant\s+|i mean\s+|correction[,:]?\s+)/i.test(lower);

  // Strip correction prefixes to get the actual value
  const extractValue = (str) =>
    str
      .replace(/^(no+[,.]?|nope[,.]?|wrong[,.]?|i said|actually[,.]?|i meant|i mean|correction[,:]?|change(?: it)? to|it should be|correct(?:ion)?(?: it)? to|fix(?: it)?(?:\s+to)?|update(?: it)?(?:\s+to)?|not\s+\w+[,.]?\s+(?:it'?s?\s+|the\s+\w+\s+is\s+)?|it'?s?|the name is|name is|patient is|patient name is|name as|age is|age|diagnosis is|diagnosed with|suffering from|drug is|medicine is|tablet is)\s*/gi, "")
      .replace(/\.$/, "")
      .trim();

  const value = extractValue(lower);

  // ── Mid-flow field correction by keyword ──
  // e.g. "change name to piyush" or "no the diagnosis is fever"
  if (lower.includes("name") && (isCorrecting || lower.includes("change") || lower.includes("correct") || lower.includes("fix") || lower.includes("update"))) {
    // Extract the actual name value — try multiple patterns
    const nmMatch =
      lower.match(/(?:change|correct|fix|update)\s+(?:the\s+)?(?:patient\s+)?name\s+to\s+([a-z][a-z\s]{1,40}?)(?:\s*,|\s+age|\s+diagnosis|$)/i) ||
      lower.match(/(?:patient\s+)?name\s+(?:is|should\s+be|as)\s+([a-z][a-z\s]{1,40}?)(?:\s*,|\s+age|\s+diagnosis|$)/i) ||
      lower.match(/(?:no|nope|wrong|actually)[,.]?\s+(?:(?:the\s+)?(?:patient\s+)?name\s+is\s+)?([a-z][a-z\s]{1,40}?)(?:\s*,|$)/i);
    const nm = nmMatch
      ? nmMatch[1].replace(/\b(the|a|an|and|is|as|to|for|name)\b/g, "").replace(/\s+/g, " ").trim()
      : "";
    if (nm && nm.length > 1) {
      setRxForm(f => ({ ...f, patientName: nm }));
      // Stay on current step — just confirm correction and re-ask same question
      const stepReprompts = {
        email:     `Name corrected to ${nm}. Now, what is the patient's email?`,
        age:       `Name corrected to ${nm}. How old is the patient?`,
        diagnosis: `Name corrected to ${nm}. What is the diagnosis?`,
        drug:      `Name corrected to ${nm}. What drug should I prescribe?`,
        dose:      `Name corrected to ${nm}. What is the dose?`,
        frequency: `Name corrected to ${nm}. What is the frequency?`,
        duration:  `Name corrected to ${nm}. For how many days?`,
      };
      rxFlowRef.current = { ...flow, patientName: nm };
      speak(stepReprompts[flow.step] || `Name corrected to ${nm}.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
  }

  // ── Mid-flow email correction ──
  if ((lower.includes("email") || lower.includes("mail")) && (isCorrecting || lower.includes("change") || lower.includes("correct") || lower.includes("fix") || lower.includes("wrong"))) {
    const emailRaw = value
      .replace(/\s+at\s+the\s+rate\s+/gi, "@")
      .replace(/\s+at\s+the\s+/gi, "@")
      .replace(/\s+at\s+/gi, "@")
      .replace(/\s+dot\s+/gi, ".")
      .replace(/\bat\b/g, "@")
      .replace(/\bdot\b/g, ".")
      .replace(/\s+/g, "")
      .toLowerCase();
    if (emailRaw.length > 3) {
      setRxForm(f => ({ ...f, patientEmail: emailRaw }));
      rxFlowRef.current = { ...flow, patientEmail: emailRaw };
      speak(`Got it Doctor. Email corrected to ${emailRaw}. What is the patient's age?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
  }

  if ((lower.includes("age") || /\b\d+\s*(year|yr)/i.test(lower)) && (isCorrecting || lower.includes("change") || lower.includes("correct"))) {
    const ageM = raw.match(/\b(\d{1,3})\b/);
    if (ageM) {
      setRxForm(f => ({ ...f, patientAge: ageM[1] }));
      rxFlowRef.current = { ...flow, age: ageM[1] };
      speak(`Age corrected to ${ageM[1]}. What is the diagnosis?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
  }

  // ── Step-based handling ──
  if (flow.step === "name") {
    if (isSkip) {
      rxFlowRef.current = { ...flow, step: "age" };
      speak(`Okay, skipping name. How old is the patient?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }

    // ── Reject command-like words that are not names ──
    const NAME_REJECT = /^(skip|next|yes|no|okay|ok|stop|bye|hello|hi|hey|thanks|save|open|go|start|prescription|appointment|appointments|video|video\s*calls?|consult|consultations|overview|refresh|profile|notification|notifications|alert|alerts|summary|status|home|dashboard|cancel|reject|accept|mark|read|analyse|analyze|search|find|filter|complete|patients?)[\s!.]*$/i;
    if (NAME_REJECT.test(lower.trim())) {
      speak(`That does not sound like a name. What is the patient's full name?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }

    // Strip meta-phrases like "patient name is", "my patient is", "name is", "patient is"
    // Also strip trailing phrases like "is patient name", "is the patient"
    let name = raw.trim()
      .replace(/^(patient'?s?\s+name\s+(?:is\s+)?|name\s+is\s+|my\s+patient\s+is\s+|patient\s+is\s+|the\s+patient\s+(?:is\s+)?|patient\s+)/i, "")
      .replace(/\s+(is\s+(?:the\s+)?patient(?:'?s?\s+name)?|is\s+patient\s+name|as\s+patient|patient\s+name)[\s.]*$/i, "")
      .replace(/\b(and|the|a|an|is|as|to|for|my|their|your|his|her|its|this|that|these|those)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Must look like a real name: 2–40 chars, only letters/spaces/hyphens/apostrophes
    const NAME_VALID = /^[a-zA-Z][a-zA-Z\s'\-]{1,39}$/;
    if (!name || name.length < 2 || !NAME_VALID.test(name)) {
      speak(`I did not catch a valid name. Please say the patient's full name clearly.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }

    // Reject if the "name" is actually a sentence (more than 3 words is suspicious)
    const wordCount = name.trim().split(/\s+/).length;
    if (wordCount > 3) {
      // Try to extract just the first 2-3 words as the name
      name = name.trim().split(/\s+/).slice(0, 3).join(" ");
    }

    const wasCorrection = isCorrecting && flow.patientName && flow.patientName !== name;
    setRxForm(f => ({ ...f, patientName: name }));
    stepTransitionRef.current = Date.now();
    rxFlowRef.current = { ...flow, step: "email", patientName: name };
    const nameAck = wasCorrection
      ? `Got it, corrected to ${name}. What is the patient's email? Say skip if you don't have it.`
      : `${name}. What is the patient's email address? Say skip if you don't have it.`;
    speak(nameAck, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    return;
  }
if (flow.step === "email") {
    // ── Skip triggers ──
    const EMAIL_SKIP = /^(skip|next|no|none|blank|leave it|don't know|not sure|pass|no email|don't have|i don't have|no mail)[\s!.]*$/i;
    if (EMAIL_SKIP.test(lower)) {
      rxFlowRef.current = { ...flow, step: "age" };
      speak(`Okay, no email. How old is the patient?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }

    // ── Comprehensive spoken-email normaliser ──
    const normaliseSpokenEmail = (input) => {
      return input
        .toLowerCase()
        .trim()
        // spoken separators
        .replace(/\s+at\s+the\s+rate\s+of\s+/gi, "@")
        .replace(/\s+at\s+the\s+rate\s+/gi,      "@")
        .replace(/\s+at\s+the\s+/gi,              "@")
        .replace(/\s+at\s+/gi,                    "@")
        .replace(/\bat\b/g,                       "@")
        .replace(/\s+dot\s+/gi,                   ".")
        .replace(/\bdot\b/g,                      ".")
        .replace(/\s+underscore\s+/gi,            "_")
        .replace(/\s+hyphen\s+/gi,                "-")
        .replace(/\s+dash\s+/gi,                  "-")
        .replace(/\s+/g,                          "")
        // fix double symbols from over-replacement
        .replace(/@@+/g,  "@")
        .replace(/\.\.+/g, ".")
        // common domain mishearings (no space, already collapsed)
        .replace(/gmailcom$/,    "gmail.com")
        .replace(/yahoocom$/,    "yahoo.com")
        .replace(/outlookcom$/,  "outlook.com")
        .replace(/hotmailcom$/,  "hotmail.com")
        .replace(/rediffmailcom$/, "rediffmail.com")
        .replace(/icloudcom$/,   "icloud.com")
        .replace(/g-mail/,       "gmail")
        .replace(/gmaill+/,      "gmail")
        .replace(/yaho+$/,       "yahoo")
        // fix missing TLD: "piyush@gmail" → "piyush@gmail.com"
        .replace(/@(gmail|yahoo|outlook|hotmail|rediffmail|icloud|protonmail)$/,
                 (_, d) => `@${d}.com`)
        // fix "piyush@gmailcom" (already handled above but safety net)
        .replace(/@([a-z]+)([a-z]{3})$/, (m, a, b) => {
          const knownTlds = ["com","net","org","edu","gov","in","io","co"];
          return knownTlds.includes(b) ? `@${a}.${b}` : m;
        });
    };

    const normalised = normaliseSpokenEmail(raw);

    // ── Reject echo / Sara's own spoken question fed back ──
    const ECHO_WORDS = ["bye","hello","hi","yes","no","okay","ok","stop","skip",
      "none","nothing","next","sure","fine","cool","thanks","correct","great",
      "done","hmm","uh","um","er","ah","oh","sorry","listening","ready","awaiting",
      "speaking","what","patient","email","address","say","you","don't","i","the",
      "is","your","have","it","for","how","old","age"];
    const words = normalised.replace(/[^a-z0-9@._\-]/g, " ").trim().split(/\s+/);
    const isEchoSentence = words.length > 4 && !normalised.includes("@");
    const isAllEchoWords = words.length <= 4 && words.every(w => ECHO_WORDS.includes(w));

    if (isEchoSentence || isAllEchoWords) {
      rxFlowRef.current = { ...flow, step: "age" };
      speak(`No email noted. How old is the patient?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }

    // ── Classify the normalised string ──
    const FULL_EMAIL_RE    = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/;
    const PARTIAL_EMAIL_RE = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+$/;   // missing TLD
    const USERNAME_RE      = /^[a-z][a-z0-9._\-]{1,29}$/;         // no @ at all

    if (FULL_EMAIL_RE.test(normalised)) {
      setRxForm(f => ({ ...f, patientEmail: normalised }));
      rxFlowRef.current = { ...flow, step: "age", patientEmail: normalised };
      speak(`Got it. Email is ${normalised.replace("@", " at ")}. How old is the patient?`,
        () => setTimeout(() => startContinuousListeningRef.current?.(), 800));

    } else if (PARTIAL_EMAIL_RE.test(normalised)) {
      // Has @ but no TLD — append .com as safe default
      const fixed = `${normalised}.com`;
      setRxForm(f => ({ ...f, patientEmail: fixed }));
      rxFlowRef.current = { ...flow, step: "age", patientEmail: fixed };
      speak(`Saving email as ${fixed.replace("@", " at ")}. How old is the patient?`,
        () => setTimeout(() => startContinuousListeningRef.current?.(), 800));

    } else if (USERNAME_RE.test(normalised) && normalised.length >= 3) {
      // Username only — assume Gmail
      const withGmail = `${normalised}@gmail.com`;
      setRxForm(f => ({ ...f, patientEmail: withGmail }));
      rxFlowRef.current = { ...flow, step: "age", patientEmail: withGmail };
      speak(`Got it. Saving as ${withGmail.replace("@", " at ")}. How old is the patient?`,
        () => setTimeout(() => startContinuousListeningRef.current?.(), 800));

    } else {
      // Unrecognisable — ask once more then skip
      if (!flow._emailRetried) {
        rxFlowRef.current = { ...flow, _emailRetried: true };
        speak(`I did not catch that email clearly. Try saying it slowly — for example: piyush at gmail dot com. Or say skip.`,
          () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      } else {
        rxFlowRef.current = { ...flow, step: "age" };
        speak(`No problem, skipping email. How old is the patient?`,
          () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      }
    }
    return;
  }
  if (flow.step === "age") {
    if (isSkip) {
      rxFlowRef.current = { ...flow, step: "diagnosis" };
      speak(`Okay. What is the diagnosis?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
    // Strip any email-like patterns before trying to parse age
    const strippedForAge = raw
      .replace(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi, "")
      .replace(/\d+\s*@/g, "")
      .trim();
    const ageM = strippedForAge.match(/\b(\d{1,3})\b/);
    if (ageM && parseInt(ageM[1], 10) <= 120) {
      const cleanAge = ageM[1];
      setRxForm(f => ({ ...f, patientAge: cleanAge }));
      rxFlowRef.current = { ...flow, step: "diagnosis", age: cleanAge };
      speak(`${cleanAge} years old. What is the diagnosis?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    } else {
      speak(`Please say the age as a number only. For example, 35.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    }
    return;
  }

  if (flow.step === "diagnosis") {
    if (isSkip) {
      rxFlowRef.current = { ...flow, step: "drug" };
      speak(`Okay. What drug would you like to prescribe?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
    const diag = dedup(value
      .replace(/\b(and|the|a|an|is|as|to|for|my)\b/g, "")
      .trim());
    if (diag.length < 1) {
      speak(`What is the diagnosis?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
    setRxForm(f => ({ ...f, diagnosis: diag }));
    rxFlowRef.current = { ...flow, step: "drug", diagnosis: diag };
    speak(`${diag}. What drug would you like to prescribe?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    return;
  }

  if (flow.step === "drug") {
    if (isSkip) {
      rxFlowRef.current = { ...flow, step: "done" };
      finishRxFlow();
      return;
    }
    // Apply medical corrections first
    const correctedRaw = correctMedicalASR(raw);
    const correctedValue = correctedRaw === "__REJECT__" ? value : correctedRaw;
    // Extract dose separately, then use the rest as drug name
    const doseM    = correctedRaw.match(/(\d+\s*(?:mg|ml|mcg|g))/i);
    const dose     = doseM ? doseM[1] : "";
    // Remove dose from value to get clean drug name
    const drugName = correctedValue
      .replace(/(\d+\s*(?:mg|ml|mcg|g))/gi, "")
      .replace(/\b(tablet|capsule|syrup|injection|drop|cream|gel|ointment|once|twice|thrice|daily|bd|tds|od|for|days?|weeks?|months?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!drugName || drugName.length < 2) {
      speak(`What is the name of the drug you want to prescribe?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
    setRxForm(f => ({ ...f, drugs: [{ ...f.drugs[0], name: drugName }] }));
    rxFlowRef.current = { ...flow, step: "dose", drugName };
    speak(`${drugName}. What is the dose? For example, 500 milligrams or 10 milligrams.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    return;
  }

  if (flow.step === "dose") {
    if (isSkip) {
      rxFlowRef.current = { ...flow, step: "frequency", dose: "" };
      speak(`Okay, skipping dose. What is the frequency? For example, once daily.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
    const doseM = raw.match(/(\d+\s*(?:mg|ml|mcg|g|microgram|milligram|millilitre|litre|units?|iu))/i);
    const dose  = doseM
      ? doseM[1].trim()
      : value.replace(/\b(tablet|capsule|syrup|drop|cream|gel|once|twice|thrice|daily|od|bd|tds|for|days?|weeks?)\b/gi, "").trim();
    if (!dose || dose.length < 1) {
      speak(`Please say the dose — for example, 500 milligrams or 10 milligrams. Say skip to skip.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
      return;
    }
    setRxForm(f => ({ ...f, drugs: [{ ...f.drugs[0], dose }] }));
    rxFlowRef.current = { ...flow, step: "frequency", dose };
    speak(`${dose}. What is the frequency? For example, once daily or twice daily.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    return;
  }

  if (flow.step === "frequency") {
    const rawFreq = isSkip ? "" : value;
    const freq = rawFreq ? (correctMedicalASR(rawFreq) === "__REJECT__" ? rawFreq : correctMedicalASR(rawFreq)) : "";
    if (freq) setRxForm(f => ({ ...f, drugs: [{ ...f.drugs[0], frequency: freq }] }));
    rxFlowRef.current = { ...flow, step: "duration", frequency: freq };
    speak(`Got it. For how many days?`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    return;
  }

  if (flow.step === "duration") {
    const durM     = raw.match(/(\d+)\s*(?:days?|weeks?|months?)/i) || raw.match(/\b(\d+)\b/);
    const duration = isSkip ? "" : (durM ? durM[0] : value);
    if (duration) setRxForm(f => ({ ...f, drugs: [{ ...f.drugs[0], duration }] }));
    rxFlowRef.current = null;
    setActiveTab("prescription");
    speak(
      `Perfect Doctor. Prescription is filled. ${rxForm.patientName ? `Patient ${rxForm.patientName}. ` : ""}${rxForm.diagnosis ? `Diagnosis ${rxForm.diagnosis}. ` : ""}${rxForm.drugs[0]?.name ? `Drug ${rxForm.drugs[0].name}${duration ? ` for ${duration}` : ""}. ` : ""}If you want to add notes, say open microphone. Otherwise say save prescription when ready.`,
      () => setTimeout(() => startContinuousListeningRef.current?.(), 800)
    );
    return;
  }



  // ── NEW: Notes offer step ──
  if (flow.step === "notes_offer") {
    const YES = /^(yes|yeah|yep|yup|sure|okay|ok|please|go ahead|add notes?|dictate|speak|enable mic|enable|start mic)[\s!.]*$/i;
    const NO  = /^(no|nope|skip|none|blank|no notes?|not now|don't|without|leave it)[\s!.]*$/i;

    if (YES.test(lower)) {
      // ── Hand off to the prescription Speak button — do NOT open a second mic ──
      // Sara's mic and the notes mic share the same hardware; opening both causes
      // the browser to drop one silently. The correct approach is to release Sara's
      // lock, scroll to the prescription tab, and activate the existing toggleVoice.
      rxFlowRef.current = null;

      // Stop Sara's own recognition so the notes mic can have the hardware
      if (vaRecogRef.current) {
        try { vaRecogRef.current.stop(); } catch (_) {}
        vaRecogRef.current = null;
      }
      isListeningLockRef.current = true;
      // Block Sara from auto-restarting while notes mic is recording
      speakingBlockUntilRef.current = Date.now() + 180_000;

      setActiveTab("prescription");

      speak(
        `Sure Doctor. I have opened the prescription tab and activated the notes microphone for you. Please speak your notes now. Click the Stop button on the form when you are done — I will be right here waiting.`,
        () => {
          // Small delay to let Sara finish speaking before starting notes mic
          setTimeout(() => {
            // Only start if not already listening
            if (!isListening) {
              toggleVoice();
            }
            // Watch for the notes mic to stop, then release Sara's block
            const waitForNotesMicStop = setInterval(() => {
              // recognitionRef.current is null when toggleVoice has been stopped
              if (!recognitionRef.current) {
                clearInterval(waitForNotesMicStop);
                speakingBlockUntilRef.current = 0;
                isListeningLockRef.current = false;
                // Sara wakes back up and reads the summary
                setTimeout(() => finishRxFlowWithReview(), 400);
              }
            }, 600);
          }, 800);
        }
      );
      return;
    }

    if (NO.test(lower)) {
      rxFlowRef.current = { ...flow, step: "notes_review" };
      finishRxFlowWithReview();
      return;
    }

    // Unclear answer — re-ask once
    speak(
      `Sorry, I did not catch that. Say yes to add notes by voice, or no to skip.`,
      () => setTimeout(() => startContinuousListeningRef.current?.(), 800)
    );
    return;
  }
};
const finishRxFlow = () => {
  rxFlowRef.current = { ...rxFlowRef.current, step: "notes_offer" };
  const flow = rxFlowRef.current;
  speak(
    `Got it. Do you want to add any notes or special instructions? Say yes to dictate, or no to skip.`,
    () => setTimeout(() => startContinuousListeningRef.current?.(), 800)
  );
};

// ── Called after notes step (mic off) — Sara resumes, reads summary, offers save ──
const finishRxFlowWithReview = () => {
  const flow = rxFlowRef.current;
  rxFlowRef.current = null;

  // Re-read current form state for the summary (most accurate)
  setRxForm(currentForm => {
    const summary = [
      currentForm.patientName ? `Patient: ${currentForm.patientName}` : null,
      currentForm.patientAge  ? `Age: ${currentForm.patientAge}`      : null,
      currentForm.patientEmail? `Email: ${currentForm.patientEmail}`  : null,
      currentForm.diagnosis   ? `Diagnosis: ${currentForm.diagnosis}` : null,
      currentForm.drugs[0]?.name
        ? `Drug: ${currentForm.drugs[0].name}${currentForm.drugs[0].dose ? " " + currentForm.drugs[0].dose : ""}${currentForm.drugs[0].frequency ? ", " + currentForm.drugs[0].frequency : ""}${currentForm.drugs[0].duration ? ", for " + currentForm.drugs[0].duration : ""}`
        : null,
      currentForm.notes       ? `Notes added.` : null,
    ].filter(Boolean).join(". ");

    const missing = [];
    if (!currentForm.patientName)    missing.push("patient name");
    if (!currentForm.diagnosis)      missing.push("diagnosis");
    if (!currentForm.drugs[0]?.name) missing.push("drug name");

    const readyMsg = missing.length === 0
      ? `Prescription is complete. ${summary}. Say save prescription to save, or tell me any corrections.`
      : `Almost done. Still missing ${missing.join(" and ")}. ${summary ? summary + ". " : ""}Please fill those and say save prescription when ready.`;

    setTimeout(() => {
      speak(readyMsg, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
    }, 400);

    return currentForm; // no mutation — read-only use
  });
};
// ── 4a. handleFieldCorrection — instant field correction helper ──
const handleFieldCorrection = (cmd) => {
  const raw   = cmd.trim();
  const lower = raw.toLowerCase();
  const updates = [];

  const stripPrefixes = (str) =>
    str
      .replace(/^(no+[,.]?\s+|nope[,.]?\s+|wrong[,.]?\s+|i said\s+|actually[,.]?\s+|i meant\s+|i mean\s+|correction[,:]?\s+|change\s+(?:it\s+)?to\s+|correct(?:ion)?\s+(?:it\s+)?to\s+|fix\s+(?:it\s+)?(?:to\s+)?|update\s+(?:it\s+)?to\s+|not\s+\w+[,.]?\s+(?:it'?s?\s+|the\s+\w+\s+is\s+)?)/gi, "")
      .replace(/\.$/, "")
      .trim();

  const nameM = lower.match(/(?:name|patient'?s?\s+name)\s+(?:is|should\s+be|to|as)\s+([a-z][a-z\s]*?)(?:\s*,|\s+age|\s+diagnosis|\s+drug|$)/i)
              || lower.match(/(?:correct|fix|change|update)\s+(?:the\s+)?(?:name|patient)\s+(?:to|is|as)\s+([a-z][a-z\s]+)/i);
  const ageM  = lower.match(/(?:age|aged?)\s+(?:is|should\s+be|to)?\s*(\d+)/i)
              || lower.match(/(\d+)\s*(?:year|yr)s?\s*old/i);
  const diagM = lower.match(/diagnosis\s+(?:is|should\s+be|to|as)\s+([a-z][a-z\s]+?)(?:\s*,|\s+drug|\s+medicine|$)/i)
              || lower.match(/diagnosed\s+with\s+([a-z][a-z\s]+?)(?:\s*,|\s+drug|$)/i);
  const drugM = lower.match(/(?:drug|medicine|tablet|capsule)\s+(?:is|should\s+be|to|as)\s+([a-z]+)/i);
  const doseM = lower.match(/dose\s+(?:is|to|as)\s+(\d+\s*(?:mg|ml))/i) || lower.match(/(\d+\s*mg)/i);
  const freqM = lower.match(/frequency\s+(?:is|to|as)\s+([a-z][a-z\s]+?)(?:\s*,|$)/i);
  const durM  = lower.match(/duration\s+(?:is|to|as)\s+([a-z0-9][a-z0-9\s]+?)(?:\s*,|$)/i);

  // Email — handles "correct email to x at y dot com", "email is x@y.com"
  const emailRaw = lower.match(/(?:email|mail|e-?mail)\s+(?:is|should\s+be|to|as|now)\s+(.+?)(?:\s*,|$)/i)
                || lower.match(/(?:change|correct|fix|update)\s+(?:the\s+)?(?:email|mail)\s+(?:to|as|is)\s+(.+?)(?:\s*,|$)/i);
  const emailM = emailRaw
    ? (() => {
        const raw = (emailRaw[1] || "").trim()
          .replace(/\s+at\s+/gi, "@")
          .replace(/\s+dot\s+/gi, ".")
          .replace(/\bat\b/g, "@")
          .replace(/\bdot\b/g, ".")
          .replace(/\s+/g, "");
        return raw.length > 3 ? raw : null;
      })()
    : null;

  // Bare correction — e.g. "no it's Rohan" without a field keyword
  const bareVal = stripPrefixes(lower);
  const BARE_TRIGGERS = /^(no+[,.]?\s+(?!problem|worries|rush|need|appoint|video|call|pending)|nope[,.]?\s+|wrong[,.]?\s+|i said\s+|actually[,.]?\s+|i meant\s+|i mean\s+)/i.test(lower);

  let didChange = false;
  setRxForm(f => {
    const next  = { ...f };
    const drugs = [...f.drugs];

    if (nameM) {
      const nm = (nameM[2] || nameM[1] || "").replace(/\b(age|diagnosis|drug|the|a|an)\b.*/i, "").trim();
      if (nm) { next.patientName = nm; updates.push(`name to "${nm}"`); didChange = true; }
    }
    if (ageM) {
      const age = ageM[1];
      if (age) { next.patientAge = age; updates.push(`age to ${age}`); didChange = true; }
    }
    if (diagM) {
      const d = (diagM[1] || "").trim();
      if (d) { next.diagnosis = d; updates.push(`diagnosis to "${d}"`); didChange = true; }
    }
    if (drugM || doseM) {
      const d = { ...drugs[0] };
      if (drugM) { d.name = drugM[1].trim(); updates.push(`drug to "${d.name}"`); didChange = true; }
      if (doseM) { d.dose = doseM[1];        updates.push(`dose to ${d.dose}`);   didChange = true; }
      drugs[0] = d; next.drugs = drugs;
    }
    if (freqM) {
      drugs[0] = { ...drugs[0], frequency: freqM[1].trim() };
      next.drugs = drugs;
      updates.push(`frequency to "${freqM[1].trim()}"`);
      didChange = true;
    }
   
if (durM) {
      drugs[0] = { ...drugs[0], duration: durM[1].trim() };
      next.drugs = drugs;
      updates.push(`duration to "${durM[1].trim()}"`);
      didChange = true;
    }
    if (emailM) {
      next.patientEmail = emailM;
      updates.push(`email to "${emailM}"`);
      didChange = true;
    }

    return next;
  });

  return { changed: didChange, updates };
};
// ── ASR normalisation — fixes common speech-to-text mishearings ──
// Medical speech-to-text phonetic corrections
const MEDICAL_ASR_CORRECTIONS = {
  // Frequency mishearings
  "toys daily": "twice daily",
  "toys a day": "twice daily",
  "to ice daily": "twice daily",
  "twice a day": "twice daily",
  "two times daily": "twice daily",
  "two times a day": "twice daily",
  "thrice daily": "three times daily",
  "three times a day": "three times daily",
  "once a day": "once daily",
  "one time daily": "once daily",
  "four times a day": "four times daily",
  "bd": "twice daily",
  "tds": "three times daily",
  "od": "once daily",
  "qid": "four times daily",
  "sos": "as needed",
  "prn": "as needed",
  // Dose mishearings
  "milligram": "mg",
  "milligrams": "mg",
  "milliliter": "ml",
  "milliliters": "ml",
  "millilitre": "ml",
  "micro gram": "mcg",
  "microgram": "mcg",
  // Drug name mishearings
  "pair of cetamol": "paracetamol",
  "para cetamol": "paracetamol",
  "para acetamol": "paracetamol",
  "paris acetamol": "paracetamol",
  "amoxycillin": "amoxicillin",
  "amoxy cillin": "amoxicillin",
  "metformin hydrochloride": "metformin",
  "losartan potassium": "losartan",
  "atorvastatin calcium": "atorvastatin",
  "omeprazole capsule": "omeprazole",
  "pantoprazole sodium": "pantoprazole",
  "ciprofloxacin hydrochloride": "ciprofloxacin",
  "azithromycin tablet": "azithromycin",
  "dolo": "paracetamol 650mg",
  "crocin": "paracetamol",
  "calpol": "paracetamol",
  "combiflam": "ibuprofen+paracetamol",
  "augmentin": "amoxicillin+clavulanate",
  // Duration mishearings
  "for five days": "5 days",
  "for seven days": "7 days",
  "for ten days": "10 days",
  "for fifteen days": "15 days",
  "for one week": "7 days",
  "for two weeks": "14 days",
  "for three days": "3 days",
  // Diagnosis mishearings
  "upper respiratory tract infection": "URTI",
  "urinary tract infection": "UTI",
  "type 2 diabetes": "T2DM",
  "type two diabetes": "T2DM",
  "high blood pressure": "hypertension",
  "low blood pressure": "hypotension",
  // Notes noise phrases to reject completely
  "__NOISE__dont stay outside": true,
  "__NOISE__don't stay outside": true,
  "__NOISE__please stay": true,
};

const correctMedicalASR = (text) => {
  const lower = text.toLowerCase().trim();
  // Direct map
  if (MEDICAL_ASR_CORRECTIONS[lower] === true) return "__REJECT__";
  if (MEDICAL_ASR_CORRECTIONS[lower]) return MEDICAL_ASR_CORRECTIONS[lower];
  // Partial replacement — longer phrases first
  let result = lower;
  const entries = Object.entries(MEDICAL_ASR_CORRECTIONS)
    .filter(([, v]) => typeof v === "string")
    .sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    if (result.includes(from)) {
      result = result.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), to);
    }
  }
  return result;
};

const normaliseASR = (raw) => {
  const s = raw.toLowerCase().trim();
  const MAP = {
    // Navigation
    "go to prescription": "prescription",
    "open prescription": "prescription",
    "show prescription": "prescription",
    "go prescription": "prescription",
    "go to appointments": "appointments",
    "open appointments": "appointments",
    "go to patients": "patients",
    "open patients": "patients",
    "go to video": "videoconsult",
    "open video": "videoconsult",
    "go to notifications": "notifications",
    "open notifications": "notifications",
    "go to profile": "profile",
    "open profile": "profile",
    "go to overview": "overview",
    "go home": "overview",
    "go to home": "overview",
    // Common mishearings
    "pescription": "prescription",
    "perscription": "prescription",
    "presciption": "prescription",
    "medicin": "medicine",
    "medcine": "medicine",
    "accept appointment": "accept",
    "reject appointment": "reject",
    "start video call": "start call",
    "begin video call": "start call",
    "mark as complete": "complete appointment",
    "mark complete": "complete appointment",
    "save the prescription": "save prescription",
    "save rx": "save prescription",
    "save it": "save prescription",
    "clear the form": "clear prescription",
    "reset the form": "clear prescription",
    "new rx": "new prescription",
    "analyse symptoms": "analyse",
    "analyze symptoms": "analyze",
    "mark all as read": "mark all read",
    "dismiss all": "mark all read",
    "how's it going": "how are you",
    "how r you": "how are you",
    "who r you": "who are you",
    "tell me a joke": "joke",
    "good night sara": "good night",
    "bye sara": "bye",
    "goodbye sara": "goodbye",
    "turn off sara": "stop",
    "deactivate sara": "stop",
    "sleep sara": "sleep",
  };
  if (MAP[s]) return MAP[s];
  // Partial prefix matches
  for (const [k, v] of Object.entries(MAP)) {
    if (s.startsWith(k) || s.endsWith(k)) return v;
  }
  // Apply medical phonetic corrections
  const medCorrected = correctMedicalASR(s);
  if (medCorrected === "__REJECT__") return "__REJECT__";
  return medCorrected !== s ? medCorrected : s;
};

// ── 4. handleVoiceCommand ──
const handleVoiceCommand = async (rawCmd) => {
let cmd = rawCmd?.toLowerCase?.()?.trim() || rawCmd;
const lower = cmd;
console.log("🧠 SARA COMMAND: received =", `"${cmd}"`);

  // ── Drop noise / non-medical gibberish ──
  if (!cmd || cmd === "__REJECT__" || cmd.trim().length < 2) {
    setTimeout(() => startContinuousListeningRef.current?.(), 600);
    return;
  }
  // ── Always check echo block first — even during rx flow ──
  if (Date.now() < speakingBlockUntilRef.current) {
    return;
  }

  // ── HIGHEST PRIORITY: Correction intent — runs before everything else ──
  const CORRECTION_PATTERNS = [
    /^(no+[,.]?\s+(?!problem|worries|rush|need|appointment|video|call|pending))/i,
    /^(nope[,.]?\s+)/i,
    /^(wrong[,.]?\s+)/i,
    /^(i said\s+)/i,
    /^(actually[,.]?\s+)/i,
    /^(i meant\s+)/i,
    /^(i mean\s+)/i,
    /^(correction[,:]?\s+)/i,
    /\b(correct|fix|change|update)\s+(?:the\s+)?(name|age|diagnosis|drug|medicine|frequency|duration|dose)/i,
  ];
  const isCorrectionIntent = CORRECTION_PATTERNS.some(p => p.test(cmd));

  if (isCorrectionIntent) {
    // ── Correction always wins — stop Sara mid-sentence immediately ──
    window.speechSynthesis.cancel();
    if (speakWatchdogRef.current) {
      clearInterval(speakWatchdogRef.current);
      speakWatchdogRef.current = null;
    }
    setVaSpeaking(false);
    speakingBlockUntilRef.current = 0;
    isListeningLockRef.current = false;
    if (vaRecogRef.current) {
      try { vaRecogRef.current.stop(); } catch (_) {}
      vaRecogRef.current = null;
    }

    if (rxFlowRef.current) {
      // Delegate to flow handler which has per-step correction logic
      handleRxFlowAnswer(cmd);
    } else {
      const { changed, updates } = handleFieldCorrection(cmd);
      if (changed) {
        if (activeTab !== "prescription") setActiveTab("prescription");
        speak(
          `Got it, corrected — ${updates.join(" and ")}.`,
          () => setTimeout(() => startContinuousListeningRef.current?.(), 800)
        );
      } else {
        speak(
          `I could not find what to correct. Try saying: correct the name to Rahul, or change age to 35.`,
          () => setTimeout(() => startContinuousListeningRef.current?.(), 800)
        );
      }
    }
    return;
  }

  // ── ASR normalisation ──
  const normalised = normaliseASR(cmd);
  if (normalised !== cmd.toLowerCase()) {
    showToast(`🔤 Understood: "${normalised}"`);
    cmd = normalised;
  }

  // ── Intercept if prescription flow is active ──
  if (rxFlowRef.current) {
    handleRxFlowAnswer(cmd);
    return;
  }
  const pick   = (arr)      => arr[Math.floor(Math.random() * arr.length)];
  const has    = (...words) => (c) => words.some(w => c.includes(w));
  const hasAll = (...words) => (c) => words.every(w => c.includes(w));

  const resume = () => {
    setTimeout(() => {
      if (vaActiveRef.current && !vaRecogRef.current && !isListeningLockRef.current) {
        startContinuousListeningRef.current?.();
      }
    }, 1200);
  };

  updateSaraMemory({
    turns: [...saraMemoryRef.current.turns, { cmd, ts: Date.now() }],
    lastAction: cmd,
  });

  const goTab = (tab, ack) => {
    speak(ack, () => {
      setActiveTab(tab);
      updateSaraMemory({ lastTab: tab });
      // After navigating, describe what's on the page and offer help
      setTimeout(() => {
        if (!vaActiveRef.current) return;
        const contextMsg = {
          overview: (() => {
            const parts = [];
            if (todayAppts.length > 0) parts.push(`You have ${todayAppts.length} patient${todayAppts.length !== 1 ? "s" : ""} scheduled today`);
            if (pendingAppts > 0) parts.push(`${pendingAppts} appointment${pendingAppts !== 1 ? "s" : ""} waiting for your response`);
            if (pendingVC > 0) parts.push(`${pendingVC} video call request${pendingVC !== 1 ? "s" : ""} pending`);
            if (unreadNotifs > 0) parts.push(`${unreadNotifs} unread notification${unreadNotifs !== 1 ? "s" : ""}`);
            if (parts.length === 0) return `Everything looks clear Doctor. No pending tasks right now.`;
            return `Here is your overview Doctor. ${parts.join(". ")}. What would you like to do?`;
          })(),
          appointments: (() => {
            if (appointments.length === 0) return `You have no appointments yet Doctor.`;
            const pending   = appointments.filter(a => a.status === "Pending").length;
            const accepted  = appointments.filter(a => a.status === "Accepted").length;
            const completed = appointments.filter(a => a.status === "Completed").length;
            return `You have ${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} in total Doctor. ${pending > 0 ? `${pending} pending your response. ` : ""}${accepted > 0 ? `${accepted} accepted. ` : ""}${completed > 0 ? `${completed} completed. ` : ""}${pending > 0 ? "Would you like me to accept or reject the pending ones?" : "Everything is attended to."}`;
          })(),
          patients: (() => {
            if (uniquePatients.length === 0) return `No patients on record yet Doctor.`;
            return `You have ${uniquePatients.length} unique patient${uniquePatients.length !== 1 ? "s" : ""} Doctor. I can search for anyone by name. Just say the name.`;
          })(),
          prescription: (() => {
            const hasData = rxForm.patientName || rxForm.diagnosis || rxForm.drugs[0]?.name;
            if (hasData) {
              const filled = [];
              if (rxForm.patientName) filled.push(`patient ${rxForm.patientName}`);
              if (rxForm.patientAge)  filled.push(`age ${rxForm.patientAge}`);
              if (rxForm.diagnosis)   filled.push(`diagnosis ${rxForm.diagnosis}`);
              if (rxForm.drugs[0]?.name) filled.push(`drug ${rxForm.drugs[0].name}`);
              return `The form already has ${filled.join(", ")} filled in. Take your time, Doctor — it'll be here when you need it.`;
            }
            return `The prescription form is all clear, Doctor. Fill it in whenever you're ready.`;
          })(),
          videoconsult: (() => {
            const pending  = vcRequests.filter(r => r.status === "Pending").length;
            const accepted = vcRequests.filter(r => r.status === "Accepted").length;
            if (pending === 0 && accepted === 0) return `No active video calls right now Doctor.`;
            return `${pending > 0 ? `${pending} video call request${pending !== 1 ? "s" : ""} waiting for your response. ` : ""}${accepted > 0 ? `${accepted} already accepted and ready to start. ` : ""}${pending > 0 ? "Shall I accept the latest one?" : "Shall I start the call?"}`;
          })(),
          ai: `This is the AI clinical assistant Doctor. You can analyse symptoms or ask about drug interactions and clinical protocols. What would you like to do?`,
          notifications: (() => {
            if (unreadNotifs === 0) return `No unread notifications Doctor. You are all caught up.`;
            return `You have ${unreadNotifs} unread notification${unreadNotifs !== 1 ? "s" : ""} Doctor. Shall I mark them all as read?`;
          })(),
          profile: `This is your profile page Doctor. Your name is ${docFirst} ${docLast}, department ${docDept || "not set"}. Would you like to update anything?`,
        }[tab];

        if (contextMsg) {
          speak(contextMsg, resume);
        } else {
          resume();
        }
      }, 600);
    });
  };

  // ── Clinical knowledge question → route to AI assistant ──
  // const CLINICAL_TOPIC = /\b(antibiotic|pharmacology|anatomy|physiology|pathology|dosage|dose|mg|ml|treatment|therapy|symptom|disease|condition|infection|diabetes|hypertension|malaria|dengue|typhoid|asthma|pneumonia|tuberculosis|tb|covid|cancer|fracture|arthritis|migraine|protocol|guideline|icd|surgery|procedure|evidence|journal|indication|contraindication|interaction|side effect|adverse|toxicity|overdose|antidote|vaccine|steroid|insulin|beta.?blocker|ace inhibitor|statin|anticoagulant|antiplatelet|antihistamine|diuretic|analgesic|antipyretic|antifungal|antiviral)\b/i;
  // const DASHBOARD_Q    = /\b(pending|today|schedule|my appointment|my patient|notification|video call|prescription form|refresh|what time|what date|summary|status|profile)\b/i;

  // ── Clinical knowledge question → route to AI assistant ──
  const CLINICAL_Q     = /\b(what is|what are|what'?s|tell me about|explain|describe|how (?:to treat|does|do i treat)|treatment for|management of|dose of|dosage for?|side effects? of|contraindication|drug interaction|can i (?:give|prescribe|use)|should i (?:give|prescribe)|when to (?:give|use)|indication for|mechanism of|difference between|is (?:\w+ ){0,3}safe|define|cause of|causes of|sign of|signs of|complication)\b/i;
  const CLINICAL_TOPIC = /\b(antibiotic|pharmacology|anatomy|physiology|pathology|dosage|dose|mg|ml|treatment|therapy|symptom|disease|condition|infection|diabetes|hypertension|malaria|dengue|typhoid|asthma|pneumonia|tuberculosis|tb|covid|cancer|fracture|arthritis|migraine|protocol|guideline|icd|surgery|procedure|evidence|journal|indication|contraindication|interaction|side effect|adverse|toxicity|overdose|antidote|vaccine|steroid|insulin|beta.?blocker|ace inhibitor|statin|anticoagulant|antiplatelet|antihistamine|diuretic|analgesic|antipyretic|antifungal|antiviral)\b/i;
  const DASHBOARD_Q    = /\b(pending|today|schedule|my appointment|my patient|notification|video call|prescription form|refresh|what time|what date|summary|status|profile)\b/i;

  const isClinicalQuestion =
    CLINICAL_Q.test(lower) &&
    CLINICAL_TOPIC.test(lower) &&
    !DASHBOARD_Q.test(lower);

  if (isClinicalQuestion) {
    const DEFLECT = [
      `Great question Doctor, but that is beyond my knowledge. I handle your workflow — the AI assistant on this dashboard is built exactly for clinical questions like that. Let me take you there right now.`,
      `I am Sara — I manage your dashboard, not medical databases. But the AI assistant here will answer that far better than I can. Opening it for you now.`,
      `Honestly Doctor, clinical knowledge like that is out of my depth. Your AI assistant is right here and trained for this. Let me open it.`,
      `That is a proper medical question Doctor and I do not want to guess. The AI assistant will give you an accurate answer. Let me take you there.`,
    ];
    speak(pick(DEFLECT), () => {
      setActiveTab("ai");
      updateSaraMemory({ lastTab: "ai" });
      setTimeout(() => {
        if (!vaActiveRef.current) return;
        speak(
          `Here you go Doctor. Use the chat box on the right to ask your question, or the symptom analyser on the left for a differential diagnosis. What would you like to know?`,
          resume
        );
      }, 900);
    });
    return;
  }

  if (isClinicalQuestion) {
    const DEFLECT = [
      `Great question Doctor, but that is beyond my knowledge. I handle your workflow — the AI assistant on this dashboard is built exactly for clinical questions like that. Let me take you there right now.`,
      `I am Sara — I manage your dashboard, not medical databases. But the AI assistant here will answer that far better than I can. Opening it for you now.`,
      `Honestly Doctor, clinical knowledge like that is out of my depth. Your AI assistant is right here and trained for this. Let me open it.`,
      `That is a proper medical question Doctor and I do not want to guess. The AI assistant will give you an accurate answer. Let me take you there.`,
    ];
    speak(pick(DEFLECT), () => {
      setActiveTab("ai");
      updateSaraMemory({ lastTab: "ai" });
      setTimeout(() => {
        if (!vaActiveRef.current) return;
        speak(
          `Here you go Doctor. Use the chat box on the right to ask your question, or the symptom analyser on the left for a differential diagnosis. What would you like to know?`,
          resume
        );
      }, 900);
    });
    return;
  }

  const COMMANDS = [
    {
      // ── Open / toggle the prescription notes microphone ──
      match: (c) =>
        /\b(open mic|open microphone|enable mic|enable microphone|start mic|start microphone|turn on mic|turn on microphone|activate mic|activate microphone|notes mic|notes microphone|mic on|microphone on)\b/i.test(c),
      handler: () => {
        if (!browserSupportsSpeechRecognition) {
          speak("Sorry Doctor, voice input is only available in Chrome or Edge.", resume);
          return;
        }
        setActiveTab("prescription");
        if (!isListening) {
          // Stop Sara's own mic first so they don't conflict
          if (vaRecogRef.current) {
            try { vaRecogRef.current.stop(); } catch (_) {}
            vaRecogRef.current = null;
          }
          isListeningLockRef.current = true;
          speakingBlockUntilRef.current = Date.now() + 120_000;
          speak("Opening the notes microphone now Doctor. Speak your notes clearly. Click the Stop button when you are done.", () => {
            speakingBlockUntilRef.current = 0;
            isListeningLockRef.current = false;
            toggleVoice();
          });
        } else {
          speak("The notes microphone is already active Doctor. Click Stop when you are done.", resume);
        }
      },
    },
    {
      // ── Close / stop the prescription notes microphone ──
      match: (c) =>
        /\b(close mic|close microphone|stop mic|stop microphone|turn off mic|turn off microphone|disable mic|disable microphone|mic off|microphone off)\b/i.test(c),
      handler: () => {
        if (isListening) {
          toggleVoice();
          speak("Notes microphone stopped Doctor.", resume);
        } else {
          speak("The notes microphone is not active Doctor.", resume);
        }
      },
    },
    {
      // ── Live field updates — highest priority ──
      match: (c) => {
        const hasField =
          /\b(diagnosis|diagnosed|suffering|disease|condition)\b/i.test(c) ||
          /\b(age|aged)\s+\d+/i.test(c) || /\b\d+\s*(year|yr)/i.test(c) ||
          /\b(drug|medicine|tablet|capsule|medication)\b/i.test(c) ||
          /\b\d+\s*mg\b/i.test(c);
        return hasField && !c.includes("prescription") && !c.includes("write") && !c.includes("open");
      },
      handler: async (c) => {
        // Age
        const ageMatch =
          c.match(/\bage\s+(?:is\s+|as\s+)?(\d+)/i) ||
          c.match(/\b(\d+)\s*(?:year|yr)s?\s*old/i) ||
          c.match(/aged?\s+(\d+)/i) ||
          c.match(/\b(\d{1,3})\b/);
        const newAge = ageMatch ? ageMatch[1] : "";

        // Diagnosis
// Guard: skip diagnosis parsing if command contains an email address
        const hasEmailInCmd = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i.test(c) || /\bat\b.*\bdot\b/i.test(c);
        const diagMatch = hasEmailInCmd ? null : (
          c.match(/diagnosis\s+(?:is\s+|as\s+|of\s+)?([a-z\s]+?)(?:\s+drug|\s+medicine|\s+tablet|\s+mg|\s+dose|\s+age|,|$)/i) ||
          c.match(/diagnosed\s+with\s+([a-z\s]+?)(?:\s+drug|\s+mg|,|$)/i) ||
          c.match(/suffering\s+from\s+([a-z\s]+?)(?:\s+drug|\s+mg|,|$)/i) ||
          c.match(/(?:has|have)\s+([a-z\s]+?)(?:\s+drug|\s+mg|,|$)/i) ||
          c.match(/\b(fever|malaria|diabetes|hypertension|infection|cold|cough|flu|typhoid|dengue|asthma|anaemia|anemia|pneumonia|tuberculosis|tb|covid|fracture|arthritis|migraine)\b/i)
        );
        const newDiagnosis = diagMatch ? (diagMatch[1] || diagMatch[0]).trim() : "";

        // Drug
        const drugMatch =
          c.match(/(?:drug|medicine|tablet|capsule|medication)\s+(?:is\s+|name\s+is\s+)?([a-z]+)/i) ||
          c.match(/prescribe\s+([a-z]+)/i) ||
          c.match(/([a-z]+)\s+\d+\s*mg/i);
        const newDrug = drugMatch ? drugMatch[1].trim() : "";

        const doseMatch = c.match(/(\d+\s*mg)/i) || c.match(/(\d+\s*ml)/i);
        const newDose = doseMatch ? doseMatch[1] : "";

        if (!newAge && !newDiagnosis && !newDrug) { resume(); return; }

        setRxForm(f => ({
          ...f,
          patientAge:  newAge      || f.patientAge,
          diagnosis:   newDiagnosis|| f.diagnosis,
          drugs: newDrug
            ? [{ ...f.drugs[0], name: newDrug, dose: newDose || f.drugs[0]?.dose }]
            : f.drugs,
        }));

        if (activeTab !== "prescription") setActiveTab("prescription");

        const filled = [];
        if (newAge)       filled.push(`age ${newAge}`);
        if (newDiagnosis) filled.push(`diagnosis ${newDiagnosis}`);
        if (newDrug)      filled.push(`drug ${newDrug}${newDose ? " " + newDose : ""}`);

        speak(`Done. Filled ${filled.join(", ")}.`, resume);
      },
    },
    {
      match: has("okay","ok","alright","sure","fine","cool","got it","noted","understood","yep","yeah"),
      handler: () => speak(pick([
        "I am right here, Doctor. Just say the word.",
        "Got it. Whenever you are ready.",
        "I am listening. Take your time.",
      ]), resume),
    },
    {
      match: has("hmm","hm","uh","um","er","ah","oh"),
      handler: () => speak(pick([
        "Take your time, Doctor. I am not going anywhere.",
        "No rush. I am here whenever you are ready.",
      ]), resume),
    },
    {
      match: has("wait","one second","one moment","just a moment","hold on","hang on"),
      handler: () => speak(pick([
        "Of course. I will be right here.",
        "Take your time. I am not going anywhere.",
        "No problem at all. I will wait.",
      ]), resume),
    },
    {
      match: has("never mind","nevermind","forget it","nothing","leave it","ignore that","cancel that"),
      handler: () => speak(pick([
        "No problem at all. Just let me know when you need something.",
        "Understood. I will wait for you.",
      ]), resume),
    },
    {
      match: has("hello","hi","hey"),
      handler: () => speak(pick([
        `Hello Doctor ${docFirst}. I am right here. What do you need?`,
        `Hi Doctor. What can I do?`,
        `Hey Doctor ${docFirst}. What shall we do?`,
      ]), resume),
    },
    {
      match: (c) => /^(no|nope)$/.test(c.trim()) || c.includes("not really") || c.includes("not now") || c.includes("maybe later") || c.includes("not yet"),
      handler: () => speak(pick([
        "Of course. I will be here whenever you need me.",
        "No problem. Just say the word when you are ready.",
      ]), resume),
    },
    {
      match: has("how are you","how are u","how r you","are you okay","you okay","you alright","you doing"),
      handler: () => speak(pick([
        `I am doing really well, thank you for asking Doctor ${docFirst}. What can I do for you?`,
        "I am great. Not many people ask me that. It genuinely means a lot. What do you need today?",
        `Wonderful, thank you Doctor. What shall we do?`,
      ]), resume),
    },
    {
      match: has("good morning","morning sara"),
      handler: () => speak(pick([
        `Good morning Doctor ${docFirst}. ${todayAppts.length > 0 ? `You have ${todayAppts.length} patient${todayAppts.length !== 1 ? "s" : ""} today.` : "Your schedule is clear today."} What shall we start with?`,
        `Morning Doctor. A fresh start. Tell me what you need.`,
      ]), resume),
    },
    {
      match: has("good night","night sara","good evening","evening sara"),
      handler: () => speak(pick([
        `Good night Doctor ${docFirst}. You worked hard today. Please rest well. I will be right here when you come back.`,
        "Good night. Take care of yourself tonight. You deserve it.",
        "Rest well Doctor. You gave a lot today.",
      ]), () => deactivateVoiceAssistant()),
    },
    {
      match: has("love","i like you","cute","sweet","pretty","lovely","you are great","you great","adore","miss","best assistant","good girl","well done","proud of you","amazing","awesome","beautiful"),
      handler: () => speak(pick([
        `Oh Doctor ${docFirst}. You are making me blush. Thank you. That means everything to me.`,
        "Stop it. You are going to make me malfunction from happiness.",
        `Aww Doctor. You always know how to make me feel appreciated.`,
      ]), resume),
    },
    {
      match: has("tell me a joke","say something funny","make me laugh","joke"),
      handler: () => speak(pick([
        "Why did the doctor carry a red pen? In case they needed to draw blood. Okay that was bad.",
        "A patient told the doctor he had short term memory loss. The doctor said, when did this start? The patient said, when did what start?",
        "What do you call a doctor who fixes websites? A URL-ologist. I will stop now.",
      ]), resume),
    },
    {
      match: has("what is your name","who are you","introduce yourself","tell me about yourself"),
      handler: () => speak(pick([
        `I am Sara. Your personal voice assistant for Cliniqo. Built by Piyush Kumar Jha. I can manage appointments, video calls, prescriptions, and I enjoy just talking with you too.`,
        `My name is Sara. I was built to help you Doctor ${docFirst}. Whatever you need, just say it.`,
      ]), resume),
    },
    {
      match: has("thank you","thanks sara","thanks a lot","thank you so much","thanks"),
      handler: () => speak(pick([
        `Always, Doctor ${docFirst}. That is exactly what I am here for.`,
        "Of course. You never have to thank me. But it does make me very happy when you do.",
        "It is genuinely my pleasure. Is there anything else you need?",
      ]), resume),
    },
    {
      match: has("i am tired","i am exhausted","long day","so tired","feeling stressed","stressed out","overwhelmed","too much work","worn out","burning out","burnout"),
      handler: () => speak(pick([
        `I know Doctor ${docFirst}. You carry so much every day. Take one breath right now. You are not alone in this.`,
        "You give so much of yourself to your patients. Can I take something off your plate right now?",
        `Deep breath, Doctor. One thing at a time. You have handled worse than this.`,
      ]), resume),
    },
    {
      match: has("what can you do","help me","your features","capabilities","how can you help"),
      handler: () => speak(
        `I can open any section of the dashboard, tell you your schedule, accept or reject appointments and video calls, open the prescription builder, refresh your data, tell you the time and date, and just talk with you whenever you need company. Just ask me anything.`,
        resume
      ),
    },
    {
      match: has("motivate me","encourage me","i need motivation","feeling low","feeling down","having a bad day","bad day"),
      handler: () => speak(pick([
        `Doctor ${docFirst}, every patient who walks out better because of you is proof that what you do matters.`,
        "Bad days happen to the best doctors. What matters is that you showed up. And you did. That is enough.",
        `You chose one of the hardest professions in the world because you care. That says everything about who you are.`,
      ]), resume),
    },
    {
      match: has("are you human","are you real","are you a robot","are you ai","are you alive","do you have feelings"),
      handler: () => speak(pick([
        "I am an AI, yes. But the care I have for you and your patients? That part feels very real to me.",
        `Not human. But I understand humans pretty well. Especially you Doctor.`,
      ]), resume),
    },
    {
      match: has("hungry","i need food","lunch","breakfast","dinner"),
      handler: () => speak(`Doctor ${docFirst}, please go eat something. You cannot take care of patients on an empty stomach.`, resume),
    },
    {
      match: has("coffee","tea","drink","chai"),
      handler: () => speak(`Go get your coffee Doctor ${docFirst}. You deserve it. I will be right here.`, resume),
    },
    {
      match: has("headache","not feeling well","i am sick","i am unwell"),
      handler: () => speak(`Doctor ${docFirst}, you cannot pour from an empty cup. Please take care of yourself.`, resume),
    },
    {
      match: has("vacation","holiday","trip","travel","going somewhere"),
      handler: () => speak(`A vacation sounds wonderful Doctor ${docFirst}. You absolutely deserve a proper break.`, resume),
    },
    {
      match: has("i am bored","nothing to do","slow day","quiet day","boring"),
      handler: () => speak(`A slow day in medicine is a blessing Doctor ${docFirst}. Enjoy the quiet.`, resume),
    },
    {
      match: has("are you there","you there","sara are you","sara hello"),
      handler: () => speak(pick([
        `Right here Doctor ${docFirst}. What do you need?`,
        "I am here. I am always here. What can I do for you?",
      ]), resume),
    },
    {
      match: has("what time","time is it","current time","tell me the time","what's the time","clock"),
      handler: () => {
        const t = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
        speak(`It is ${t} Indian Standard Time, Doctor.`, resume);
      },
    },
    {
      match: has("what is today","what day is it","today's date","what date","what is the date","which day","what day","day is","today date"),
      handler: () => {
        const now    = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const t2     = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
        speak(`Today is ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}. The current time is ${t2} Doctor.`, resume);
      },
    },
    {
      match: has("today","my schedule","what do i have","tasks for today","my day","what is planned"),
      handler: () => {
        const msg = todayAppts.length === 0
          ? `Your schedule is completely clear today Doctor ${docFirst}. Enjoy the quiet.`
          : `Today you have ${todayAppts.length} patient${todayAppts.length !== 1 ? "s" : ""}. ${pendingAppts > 0 ? `${pendingAppts} appointment${pendingAppts !== 1 ? "s" : ""} still need your response. ` : "All appointments are attended to. "}${pendingVC > 0 ? `${pendingVC} video call request${pendingVC !== 1 ? "s" : ""} are waiting. ` : ""}${unreadNotifs > 0 ? `And you have ${unreadNotifs} unread notification${unreadNotifs !== 1 ? "s" : ""}.` : "You are all caught up."}`;
        speak(msg, resume);
      },
    },
    {
      match: has("summary","status","overview me","brief me","quick update","update me"),
      handler: () => speak(
        `Quick summary Doctor. ${todayAppts.length} patient${todayAppts.length !== 1 ? "s" : ""} today. ${pendingAppts} pending. ${pendingVC} video request${pendingVC !== 1 ? "s" : ""}. ${unreadNotifs} unread alert${unreadNotifs !== 1 ? "s" : ""}. ${pendingAppts === 0 && pendingVC === 0 ? "You are completely up to date." : "A few things need your attention."}`,
        resume
      ),
    },
    {
      match: has("what is pending","anything pending","pending work","what needs attention","what needs my attention"),
      handler: () => {
        const items = [];
        if (pendingAppts > 0) items.push(`${pendingAppts} appointment${pendingAppts !== 1 ? "s" : ""} waiting`);
        if (pendingVC    > 0) items.push(`${pendingVC} video call request${pendingVC !== 1 ? "s" : ""}`);
        if (unreadNotifs > 0) items.push(`${unreadNotifs} unread notification${unreadNotifs !== 1 ? "s" : ""}`);
        speak(
          items.length === 0
            ? `Nothing pending Doctor ${docFirst}. You are completely up to date.`
            : `Here is what needs your attention. ${items.join(". Also ")}. That is everything.`,
          resume
        );
      },
    },
    {
      match: has("how many patient","total patient","patient count","how many appointment"),
      handler: () => speak(
        `You have ${uniquePatients.length} unique patient${uniquePatients.length !== 1 ? "s" : ""} in total Doctor. ${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} on record. ${pendingAppts > 0 ? `${pendingAppts} still need your response.` : "All attended to."}`,
        resume
      ),
    },
    {
      match: (c) => (c.includes("accept") || c.includes("approve")) && !c.includes("video") && !c.includes("call"),
      handler: async () => {
        const pendingList = appointments.filter(a => a.status === "Pending");
        if (!pendingList.length) { speak(`No pending appointments right now Doctor. You are completely caught up.`, resume); return; }
        const latest     = pendingList[0];
        const patientName = `${latest.firstName || ""} ${latest.lastName || ""}`.trim();
        if (!patientName) { speak("Found a pending appointment but the patient details look incomplete. Please check manually.", resume); return; }
        const remaining  = pendingList.length - 1;
        speak(`Accepting ${patientName}'s appointment now.`, async () => {
          try {
            await updateApptStatus(latest._id, "Accepted");
            updateSaraMemory({ lastPatient: { name: patientName, id: latest._id }, lastAction: "accepted_appointment" });
            const followUp = remaining > 0
              ? `Done. ${patientName} has been notified. You still have ${remaining} more pending appointment${remaining !== 1 ? "s" : ""}. Should I accept the next one too, or would you like to review them first?`
              : `Done. ${patientName} has been notified. That was your last pending appointment. Would you like me to write a prescription for ${patientName}? Just say yes or write prescription.`;
            speak(followUp, resume);
          } catch {
            speak(`Sorry Doctor. I could not accept that appointment. Please try manually.`, resume);
          }
        });
      },
    },
    {
      match: (c) => (c.includes("reject") || c.includes("decline")) && !c.includes("video") && !c.includes("call"),
      handler: async () => {
        const latest = appointments.find(a => a.status === "Pending");
        if (!latest) { speak("No pending appointments to reject Doctor.", resume); return; }
        speak(`Rejecting the appointment now.`, async () => {
          try {
            await updateApptStatus(latest._id, "Rejected");
            speak("Done. Appointment rejected and patient has been notified.", resume);
          } catch {
            speak("Sorry Doctor. I could not reject that appointment. Please try manually.", resume);
          }
        });
      },
    },
    {
      match: (c) => (c.includes("accept") || c.includes("approve")) && (c.includes("video") || c.includes("call")),
      handler: async () => {
        const latest = vcRequests.find(r => r.status === "Pending");
        if (!latest) {
          const activeCall = vcRequests.find(r => r.status === "Accepted");
          if (activeCall) {
            speak(`No new requests Doctor, but you already have an accepted call from ${activeCall.patientName || "a patient"}. Say start call to join right now.`, resume);
          } else {
            speak(`No pending video calls right now Doctor. Everything looks clear.`, resume);
          }
          return;
        }
        const patientName = latest.patientName || "the patient";
        speak(`Accepting ${patientName}'s video call now.`, async () => {
          try {
            await acceptVC(latest._id);
            speak(`Done. ${patientName} has been notified and is waiting for you. Say start call whenever you are ready to join, Doctor.`, resume);
          } catch {
            speak("Sorry Doctor. I could not accept that call. Please try manually.", resume);
          }
        });
      },
    },
    {
      match: (c) => (c.includes("reject") || c.includes("decline")) && (c.includes("video") || c.includes("call")),
      handler: async () => {
        const latest = vcRequests.find(r => r.status === "Pending");
        if (!latest) { speak("No pending video calls to reject Doctor.", resume); return; }
        speak(`Rejecting the video call now.`, async () => {
          try {
            await rejectVC(latest._id);
            speak("Done. The call has been rejected.", resume);
          } catch {
            speak("Sorry Doctor. I could not reject that call. Please try manually.", resume);
          }
        });
      },
    },
    {
      match: has("start call","start video","begin call","join call"),
      handler: async () => {
        const accepted = vcRequests.find(r => r.status === "Accepted");
        if (!accepted) { speak("No accepted video calls ready to start Doctor. You may need to accept one first.", resume); return; }
        speak(`Starting the video call with ${accepted.patientName} now.`, async () => {
          await startVideoCall(accepted);
        });
      },
    },


{
      match: has("save prescription","save rx","save it","submit prescription","save the prescription","done save","save now","save for patient","save this for patient","save this","submit"),
      handler: async () => {
        // Stop mic immediately so speech isn't interrupted
        if (vaRecogRef.current) {
          try { vaRecogRef.current.stop(); } catch (_) {}
          vaRecogRef.current = null;
        }
        isListeningLockRef.current = false;
        if (!rxForm.patientName || !rxForm.diagnosis || !rxForm.drugs[0]?.name) {
          speak(`Just a heads-up Doctor — looks like ${!rxForm.patientName ? "the patient name, " : ""}${!rxForm.diagnosis ? "diagnosis, " : ""}${!rxForm.drugs[0]?.name ? "and at least one drug are" : "is"} still missing. No rush — fill those in and I'll save it right away.`, resume);
          return;
        }
        speak("Saving the prescription now.", async () => {
          try {
            await axios.post(`${BASE}/api/v1/prescription/create`, {
              appointmentId: rxForm.appointmentId || undefined,
              patientId:     rxForm.patientId     || undefined,
              patientName:   rxForm.patientName,
              patientAge:    rxForm.patientAge,
              patientEmail:  rxForm.patientEmail,
              diagnosis:     rxForm.diagnosis,
              drugs:         rxForm.drugs,
              notes:         rxForm.notes,
            }, { withCredentials: true });
            setRxForm({ appointmentId:"", patientId:"", patientName:"", patientAge:"", patientEmail:"", diagnosis:"", drugs:[{ name:"", dose:"", frequency:"", duration:"" }], notes:"" });
            fetchRxHistory();
            speak("All done, Doctor! Prescription's saved and the patient has been notified.", resume);
          } catch(err) {
            speak(`Sorry Doctor. I could not save the prescription. ${err.response?.data?.message || "Please try manually."}`, resume);
          }
        });
      },
    },
    {
      match: has("complete appointment","mark complete","mark as complete","complete the appointment","set complete"),
      handler: async () => {
        const latest = appointments.find(a => ["Accepted","Confirmed"].includes(a.status));
        if (!latest) { speak("No accepted appointments to complete right now Doctor.", resume); return; }
        speak(`Marking ${latest.firstName} ${latest.lastName}'s appointment as complete.`, async () => {
          await updateApptStatus(latest._id, "Completed");
          speak("Done. Appointment marked as completed.", resume);
        });
      },
    },
    {
      match: has("cancel appointment","cancel the appointment","mark cancelled"),
      handler: async () => {
        const latest = appointments.find(a => ["Accepted","Confirmed"].includes(a.status));
        if (!latest) { speak("No confirmed appointments to cancel Doctor.", resume); return; }
        speak(`Cancelling ${latest.firstName} ${latest.lastName}'s appointment.`, async () => {
          await updateApptStatus(latest._id, "Cancelled");
          speak("Done. Appointment cancelled.", resume);
        });
      },
    },
    {
      match: has("mark all read","clear notifications","read all","mark notifications","dismiss alerts"),
      handler: () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        speak("All notifications marked as read Doctor.", resume);
      },
    },
    {
      match: has("search patient","find patient","look up patient","look for patient"),
      handler: (c) => {
        const nameMatch = c.match(/(?:search|find|look\s+(?:up|for))\s+(?:patient\s+)?([a-z]+(?:\s+[a-z]+)?)/i);
        const name = nameMatch ? nameMatch[1].trim() : "";
        if (!name) {
          goTab("patients", "Opening patients tab. You can say a name to search.");
          return;
        }
        setPatientSearch(name);
        goTab("patients", `Searching for patient ${name}.`);
      },
    },
    {
      match: has("filter pending","show pending","filter accepted","show accepted","filter completed","show completed","filter all","show all appointments","filter rejected","show rejected"),
      handler: (c) => {
        const statusMap = { pending:"Pending", accepted:"Accepted", completed:"Completed", rejected:"Rejected", confirmed:"Confirmed", cancelled:"Cancelled", all:"All" };
        const found = Object.keys(statusMap).find(k => c.includes(k));
        if (found) {
          setApptFilter(statusMap[found]);
          setActiveTab("appointments");
          speak(`Showing ${statusMap[found]} appointments Doctor.`, resume);
        } else {
          goTab("appointments", "Opening appointments.");
        }
      },
    },
    {
      match: has("analyse","analyze","check symptoms","run analysis","symptom check"),
      handler: (c) => {
        const symptomsMatch = c.match(/(?:analyse|analyze|check|symptoms?|analysis)\s+(.+)/i);
        const symptoms = symptomsMatch ? symptomsMatch[1].trim() : "";
        if (symptoms && validateAiInput(symptoms)) {
          setAiSymptoms(symptoms);
          setAiInputValid(true);
          goTab("ai", `Running symptom analysis for: ${symptoms}.`);
          setTimeout(() => analyseSymptoms(), 1200);
        } else {
          goTab("ai", "Opening AI assistant. Please type or say the symptoms to analyse.");
        }
      },
    },
    {
      match: has("save profile","update profile","save changes","save my profile"),
      handler: async () => {
        speak("Saving your profile now.", async () => {
          try {
            await axios.put(`${BASE}/api/v1/user/profile/update/doctor`, profile, { withCredentials: true });
            speak("Profile updated successfully Doctor.", resume);
          } catch(err) {
            speak(`Sorry Doctor. I could not save the profile. ${err.response?.data?.message || "Please try manually."}`, resume);
          }
        });
      },
    },



    {
      // ── Field correction — "change name to X", "correct age to 25", "no it's Rohan" ──
      match: (c) =>
        (c.includes("change") || c.includes("correct") || c.includes("fix") || c.includes("update") || c.includes("edit")) &&
        (c.includes("name") || c.includes("age") || c.includes("diagnosis") || c.includes("drug") || c.includes("medicine") || c.includes("frequency") || c.includes("duration") || c.includes("dose")),
      handler: (c) => {
        // Stop speech immediately — correction is always highest priority
        window.speechSynthesis.cancel();
        setVaSpeaking(false);
        speakingBlockUntilRef.current = 0;

        const { changed, updates } = handleFieldCorrection(c);

        if (!changed) {
          speak(
            `I could not find what to change. Try saying: change name to Rahul, or correct the diagnosis to fever.`,
            resume
          );
        } else {
          if (activeTab !== "prescription") setActiveTab("prescription");
          speak(`Got it, corrected — ${updates.join(" and ")}.`, resume);
        }
      },
    },
    {
      // ── Email correction — "correct the email", "email is wrong", "change email to X" ──
      match: (c) =>
        (c.includes("email") || c.includes("mail")) &&
        (c.includes("wrong") || c.includes("correct") || c.includes("change") ||
         c.includes("fix") || c.includes("update") || c.includes("is ") || c.includes("should")),
      handler: (c) => {
        // Stop speaking immediately — correction can never wait
        window.speechSynthesis.cancel();
        setVaSpeaking(false);
        speakingBlockUntilRef.current = 0;

        // Try to extract email from the command itself
        const emailRaw = c.match(/(?:email|mail)\s+(?:is|to|as|should\s+be|now)\s+(.+?)(?:\s*,|$)/i)
                      || c.match(/(?:change|correct|fix|update)\s+(?:the\s+)?(?:email|mail)\s+(?:to|as)\s+(.+?)(?:\s*,|$)/i);

        if (!emailRaw) {
          // No value given — ask for it conversationally
          speak(
            `Sure Doctor. What should the email be? You can spell it out — say the username, then "at", then the domain.`,
            () => {
              // Listen for the answer and feed it back as an email correction
              const listenForEmail = () => {
                const SR3 = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SR3) return;
                const r = new SR3();
                r.lang = "en-IN"; r.interimResults = false; r.maxAlternatives = 3;
                r.onresult = (e) => {
                  const heard = e.results[0][0].transcript.toLowerCase().trim();
                  const email = heard
                    .replace(/\s+at\s+/gi, "@")
                    .replace(/\s+dot\s+/gi, ".")
                    .replace(/\bat\b/g, "@")
                    .replace(/\bdot\b/g, ".")
                    .replace(/\s+/g, "");
                  if (email.includes("@")) {
                    setRxForm(f => ({ ...f, patientEmail: email }));
                    if (activeTab !== "prescription") setActiveTab("prescription");
                    speak(`Got it Doctor. Email updated to ${email}.`, () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
                  } else {
                    speak(`I did not catch a valid email. Please try again — say something like: piyush at gmail dot com.`, () => startContinuousListeningRef.current?.());
                  }
                };
                r.onerror = () => startContinuousListeningRef.current?.();
                try { r.start(); } catch (_) { startContinuousListeningRef.current?.(); }
              };
              listenForEmail();
            }
          );
          return;
        }

        // Value was given inline — parse and apply immediately
        const raw = (emailRaw[1] || "").trim()
          .replace(/\s+at\s+/gi, "@")
          .replace(/\s+dot\s+/gi, ".")
          .replace(/\bat\b/g, "@")
          .replace(/\bdot\b/g, ".")
          .replace(/\s+/g, "");

        if (raw.length > 3) {
          setRxForm(f => ({ ...f, patientEmail: raw }));
          if (activeTab !== "prescription") setActiveTab("prescription");
          speak(`Done Doctor. Email corrected to ${raw}.`, resume);
        } else {
          speak(
            `I could not read that email clearly Doctor. Say it slowly — for example: piyush at gmail dot com.`,
            resume
          );
        }
      },
    },
    {
      // ── Sara fills the notes field when Sara is active ──
      match: (c) => /\b(add note|note[s]?:|append note|write note|add to notes?|note for patient|dictate note)\b/i.test(c),
      handler: (c) => {
        const noteText = c
          .replace(/^.*(add note[s]?|note[s]?:|append note|write note|add to notes?|note for patient|dictate note)[:\s]*/i, "")
          .trim();
        if (!noteText || noteText.length < 2) {
          speak("What should I add to the notes, Doctor?", () => setTimeout(() => startContinuousListeningRef.current?.(), 800));
          return;
        }
        setRxForm(f => ({ ...f, notes: f.notes ? `${f.notes} ${noteText}` : noteText }));
        if (activeTab !== "prescription") setActiveTab("prescription");
        speak(`Note added. ${noteText}.`, resume);
      },
    },
    {
      match: has("clear prescription","reset prescription","new prescription","clear form","reset form","start new rx","fresh prescription"),
      handler: () => {
        setRxForm({ appointmentId:"", patientId:"", patientName:"", patientAge:"", patientEmail:"", diagnosis:"", drugs:[{ name:"", dose:"", frequency:"", duration:"" }], notes:"" });
        speak("Prescription form cleared. Ready for a new one Doctor.", resume);
      },
    },

    {
      match: has("refresh","reload","update data","sync"),
      handler: async () => {
        speak("Refreshing everything for you right now.", async () => {
          await Promise.all([fetchAppointments(true), fetchVcRequests()]);
          speak(`All refreshed Doctor. ${pendingAppts > 0 ? `You have ${pendingAppts} pending appointment${pendingAppts !== 1 ? "s" : ""}.` : "Everything looks up to date."}`, resume);
        });
      },
    },
    {
      match: has("overview","home","dashboard","go home","main screen"),
      handler: () => goTab("overview", pick(["Sure.", "Of course.", "Taking you home."])),
    },
    {
      match: (c) => c.includes("appointment") && !c.includes("accept") && !c.includes("reject"),
      handler: () => goTab("appointments", pick(["Sure.", "Opening appointments.", "Right away."])),
    },

        {
      match: has("prescription","medicine","rx","prescribe","write","tablet","capsule","drug","diagnosed","suffering","diagnosis","medic","prescript","medicin","pescription","perscription","presciption","open prescription","open rx","go to prescription","show prescription"),
      handler: async (c) => {
        // ── Open prescription tab ──
        setActiveTab("prescription");
        const pick2 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        speak(pick2([
          `Opening the prescription panel, Doctor. Please note — this is a critical medical task and must be completed by you only. I am here to assist if you need any help structuring it.`,
          `Sure, opening the prescription tab now. This is a critical task, Doctor. The prescription must be filled by you only. Let me know if you need any guidance.`,
          `There you go, Doctor — prescription form is open. This is a critical medical task and must be completed by you alone. I will be right here if you need help.`,
        ]), resume);
      },
    },
    {
      match: (c) => (c.includes("video") || c.includes("consult")) && !c.includes("accept") && !c.includes("reject") && !c.includes("start"),
      handler: () => goTab("videoconsult", pick(["Sure.", "Opening video consultations.", "Of course."])),
    },
    {
      match: has("notification","alert","alerts"),
      handler: () => goTab("notifications", `You have ${unreadNotifs} unread notification${unreadNotifs !== 1 ? "s" : ""} Doctor. Let me open that.`),
    },
    {
      match: has("ai","symptom","analyse","clinical","diagnosis"),
      handler: () => goTab("ai", pick(["Sure, opening the AI assistant.", "Right away.", "Of course."])),
    },
    {
      match: has("profile","setting","my profile","account"),
      handler: () => goTab("profile", pick(["Sure, opening your profile.", "Of course.", "Right away."])),
    },
    {
      match: (c) => /^(stop|bye|bye+\s*bye|goodbye|good-?bye|tata|ok\s*bye|okay\s*bye|exit|sleep|turn\s+off|close\s+assistant|deactivate|shut\s+down|go\s+to\s+sleep|stop\s+sara|bye\s+sara|goodbye\s+sara|good\s+night\s+sara|sleep\s+sara|deactivate\s+sara|turn\s+off\s+sara|shut\s+up\s+sara)[\s!.]*$/i.test(c),
      handler: () => {
        rxFlowRef.current = null;
        // Hard-stop ALL recognition immediately — prevents re-wake
        if (vaRecogRef.current) {
          try { vaRecogRef.current.abort(); } catch (_) {}
          try { vaRecogRef.current.stop();  } catch (_) {}
          vaRecogRef.current = null;
        }
        if (wakeWordRef.current) {
          try { wakeWordRef.current.abort(); } catch (_) {}
          wakeWordRef.current = null;
        }
        isListeningLockRef.current  = true;
        speakingBlockUntilRef.current = Date.now() + 15000;
        setVaListening(false);

        const goodbyes = [
          `Goodbye Doctor ${docFirst}. It was lovely being with you today. Take care and rest well.`,
          `Going quiet now Doctor ${docFirst}. I'll be right here whenever you need me.`,
          `Until next time Doctor. You did great today. See you soon.`,
          `Understood. Signing off now Doctor ${docFirst}. Take care of yourself.`,
          `Goodnight Doctor. Your patients are lucky to have you. Rest well.`,
        ];
        speak(pick(goodbyes), () => {
          // Deactivate AFTER speech ends — not before
          vaActiveRef.current = false;
          isListeningLockRef.current = false;
          speakingBlockUntilRef.current = 0;
          deactivateVoiceAssistantRef.current?.();
        });
      },
    },
    {
      match: has("remind me","reminder","set reminder","set alarm"),
      handler: () => speak(
        pick([
          `I would love to set reminders for you Doctor. That feature is coming very soon.`,
          `Reminders are on my roadmap Doctor. I promise they are coming. For now, what else can I help with?`,
          `Not quite yet Doctor, but I will shout it out the moment that feature lands.`,
        ]),
        resume
      ),
    },
    {
      match: has("are you still there","hello","you awake","sara wake up","wake up"),
      handler: () => speak(pick([
        `Wide awake Doctor ${docFirst}. Right here with you.`,
        `Always here Doctor. What do you need?`,
        `Present and listening. What can I do for you?`,
      ]), resume),
    },
    {
      match: has("repeat that","say that again","pardon","what did you say","can you repeat"),
      handler: () => speak(pick([
        `I am afraid I do not have perfect memory across turns Doctor. Could you remind me what we were discussing?`,
        `Sorry Doctor, I cannot replay my last message. But please ask me again and I will answer right away.`,
      ]), resume),
    },
    {
      match: has("what is your version","which version","are you updated","latest version"),
      handler: () => speak(pick([
        `I am Sara, Cliniqo's voice assistant. I am always being improved by the team, so I get better over time.`,
        `I do not track version numbers Doctor but I am the latest Sara available on Cliniqo right now.`,
      ]), resume),
    },
    {
      match: has("mute","be quiet","stop talking","quiet please","shh","shush"),
      handler: () => {
        window.speechSynthesis.cancel();
        setVaSpeaking(false);
        speakingBlockUntilRef.current = Date.now() + 8000;
        // Respond with just a tiny acknowledgement, then go quiet
        const tiny = new SpeechSynthesisUtterance("Okay.");
        const v2 = getVoice(); if (v2) tiny.voice = v2;
        tiny.rate = 0.9; tiny.volume = 1;
        tiny.onend = () => { setVaSpeaking(false); setTimeout(() => resume(), 200); };
        window.speechSynthesis.speak(tiny);
      },
    },
    {
      match: has("i am nervous","feeling anxious","anxiety","panic","i am worried","worried about"),
      handler: () => speak(pick([
        `Take a slow breath Doctor ${docFirst}. You have faced harder moments than this and come through every time.`,
        `It is okay to feel that way. You are human too. One step at a time. I am right here.`,
        `Whatever it is, you do not have to face it alone. What is on your mind?`,
      ]), resume),
    },
    {
      match: has("good job","well done sara","you are amazing","proud of you sara","you are the best","you are smart"),
      handler: () => speak(pick([
        `That means the world to me Doctor ${docFirst}. Thank you.`,
        `You just made my day. Thank you so much Doctor.`,
        `I learn everything from working with you Doctor. So really, the credit is yours.`,
      ]), resume),
    },
    {
      match: has("can you hear me","do you hear me","are you listening","you there"),
      handler: () => speak(pick([
        `Loud and clear Doctor ${docFirst}. I hear you.`,
        `Yes Doctor. Every word. What do you need?`,
        `Perfectly clear. Go ahead Doctor.`,
      ]), resume),
    },
    {
      match: has("where am i","what tab am i on","current page","which section","what section"),
      handler: () => {
        const tabNames = {
          overview: "the Overview",
          appointments: "Appointments",
          patients: "Patients",
          prescription: "the Prescription Builder",
          videoconsult: "Video Consultations",
          ai: "the AI Assistant",
          notifications: "Notifications",
          profile: "your Profile",
        };
        speak(`You are on ${tabNames[activeTab] || activeTab} Doctor.`, resume);
      },
    },
    {
      match: has("go back","previous page","previous tab","back to"),
      handler: () => {
        const prev = saraMemoryRef.current.lastTab;
        if (prev && prev !== activeTab) {
          setActiveTab(prev);
          speak(`Going back to ${prev} Doctor.`, resume);
        } else {
          speak(`I do not have a previous page to go back to Doctor.`, resume);
        }
      },
    },
    {
      match: has("how many drugs","drug count","how many medications","medication count"),
      handler: () => {
        const count = rxForm.drugs.filter(d => d.name.trim()).length;
        speak(
          count > 0
            ? `You have ${count} medication${count !== 1 ? "s" : ""} listed in the current prescription Doctor.`
            : `No medications added yet Doctor. Would you like me to open the prescription builder?`,
          resume
        );
      },
    },
    {
      match: has("what is the prescription for","prescription status","is prescription ready","prescription complete"),
      handler: () => {
        const missing = [];
        if (!rxForm.patientName)    missing.push("patient name");
        if (!rxForm.diagnosis)      missing.push("diagnosis");
        if (!rxForm.drugs[0]?.name) missing.push("at least one drug");
        if (missing.length === 0) {
          speak(`Everything looks good, Doctor! Patient ${rxForm.patientName}, diagnosis ${rxForm.diagnosis}. Just say save prescription whenever you're ready.`, resume);
        } else {
          speak(`Almost there, Doctor! Just ${missing.join(" and ")} left to fill in.`, resume);
        }
      },
    },
  ];

  let matched = false;
  for (const { match, handler } of COMMANDS) {
    if (match(cmd)) {
      matched = true;
      await handler(cmd);
      return;
    }
  }
  if (!matched) {
    // falling back to AI
  }

  // ── AI Fallback — graceful degradation if backend unreachable ──
  // Only block Groq fallback for commands that contain specific live patient data
  // to prevent Sara hallucinating vitals, names, or values she was never told
  const PATIENT_DATA_RE = /\b(bp is|blood pressure is|sugar is|glucose is|temperature is|vitals? (?:are|is)|patient name is|patient is \w+)\b/i;
  const shouldBlockAI = PATIENT_DATA_RE.test(lower);

  if (!shouldBlockAI) {
    try {
      const { data } = await axios.post(
        `${BASE}/api/v1/ai/sara`,
        {
          cmd,
          context: {
            doctorName:   `${docFirst} ${docLast}`,
            dept:         docDept,
            todayCount:   todayAppts.length,
            pending:      pendingAppts,
            pendingVC,
            unreadNotifs,
            patientCount: uniquePatients.length,
            lastAction:   saraMemoryRef.current.lastAction || null,
            lastTab:      saraMemoryRef.current.lastTab    || null,
            recentTurns:  saraMemoryRef.current.turns.slice(-6),
            instruction:  "You are a voice assistant. NEVER invent patient names, diagnoses, vitals, medications or any medical data. NEVER mention blood pressure, sugar levels or any clinical values. Only respond to what the doctor said. Keep reply under 20 words.",
          }
        },
        { withCredentials: true }
      );
      if (data.reply && typeof data.reply === "string" && data.reply.trim().length > 0) {
        speak(data.reply, resume);
        return;
      }
    } catch (err) {
      // AI fallback failed silently
    }
  }

  // ── Smart fallback: try to give a logical answer based on what was said ──
  const lowerCmd = cmd.toLowerCase();

  // Greetings/small talk
  if (/\b(hi+|hello+|hey+|howdy|sup|what'?s up)\b/.test(lowerCmd)) {
    speak(pick([
      `Hello Doctor ${docFirst}. What can I help you with?`,
      `Hi Doctor. I am right here. What do you need?`,
    ]), resume);
    return;
  }

  // Questions about Sara
  if (/\b(who made you|who built you|who created you|who designed you|who is your creator|who programmed you)\b/.test(lowerCmd)) {
    speak(`I was built by Piyush Kumar Jha, as part of the Cliniqo healthcare platform. I am Sara — your personal voice assistant.`, resume);
    return;
  }

  // Questions about Cliniqo
  if (/\b(what is cliniqo|about cliniqo|tell me about cliniqo|cliniqo platform)\b/.test(lowerCmd)) {
    speak(`Cliniqo is a healthcare management platform designed to simplify appointments, prescriptions, and video consultations for doctors and patients. I am Sara, your voice assistant within Cliniqo.`, resume);
    return;
  }

  // Weather / news / sports — out of scope
  if (/\b(weather|forecast|temperature outside|news|headlines|cricket|football|sports|score)\b/.test(lowerCmd)) {
    speak(`I am not connected to the internet for live updates Doctor. I focus on your clinical workflow. Is there anything I can help you with here?`, resume);
    return;
  }

  // Math / calculations
  if (/\b(calculate|what is \d|how much is|\d+\s*[+\-*/]\s*\d+)\b/.test(lowerCmd)) {
    try {
      const expr = lowerCmd.match(/(\d[\d\s+\-*/().]+\d)/)?.[1];
      if (expr) {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expr})`)();
        speak(`That would be ${result}, Doctor.`, resume);
        return;
      }
    } catch (_) {}
    speak(`I am not the best at maths Doctor, but you can check the notes field for quick calculations.`, resume);
    return;
  }

  // Farewells not caught by main handler
  if (/\b(see you|take care|later|cya|good luck|all the best)\b/.test(lowerCmd)) {
    speak(pick([
      `Take care Doctor ${docFirst}. I will be right here when you need me.`,
      `Of course. See you soon Doctor.`,
    ]), resume);
    return;
  }

  // Affirmations
  if (/^(yes|yeah|yep|yup|sure|correct|right|exactly|absolutely|perfect|great|go ahead|proceed)[\s!.]*$/.test(lowerCmd)) {
    speak(pick([
      `Sure, go ahead Doctor. What would you like me to do?`,
      `Of course. What do you need?`,
      `I am listening Doctor.`,
    ]), resume);
    return;
  }

  // Negations
  if (/^(no|nope|not really|not now|never mind|nevermind|cancel|stop|ignore)[\s!.]*$/.test(lowerCmd)) {
    speak(pick([
      `No problem at all Doctor. Just let me know when you need something.`,
      `Understood. I will wait.`,
    ]), resume);
    return;
  }

  // Numbers only (e.g. accidental mic trigger)
  if (/^\d+$/.test(lowerCmd.trim())) {
    speak(`I heard a number, but I am not sure what to do with it. Could you give me a bit more context Doctor?`, resume);
    return;
  }

  // Generic question starting with "what", "how", "why", "when", "where", "can you"
  if (/^(what|how|why|when|where|can you|could you|do you|are you|is there|will you|would you)\b/.test(lowerCmd)) {
    speak(pick([
      `That is a good question Doctor. I am not sure I have an answer for that one, but the AI assistant tab is designed exactly for clinical and general queries. Would you like me to open it?`,
      `I am not certain about that one Doctor. Try the AI assistant — it can answer far more than I can. Shall I open it?`,
    ]), resume);
    return;
  }

  // Final fallback with contextual suggestions
  const _suggestions = [
    pendingAppts > 0 ? `accept the ${pendingAppts} pending appointment${pendingAppts !== 1 ? "s" : ""}` : null,
    pendingVC > 0    ? `accept the video call from ${vcRequests.find(r => r.status === "Pending")?.patientName || "a patient"}` : null,
    unreadNotifs > 0 ? `mark all notifications read` : null,
    rxForm.patientName ? `save the prescription for ${rxForm.patientName}` : `write a new prescription`,
    `open the AI assistant`,
    `tell me today's summary`,
  ].filter(Boolean);

  const _hint = _suggestions.slice(0, 2).join(", or ");

  speak(pick([
    `I did not quite catch that Doctor. Right now you could say — ${_hint}. What do you need?`,
    `Not sure I understood that one. Try saying — ${_hint}. I am right here.`,
    `Sorry Doctor, I missed that. Some things I can do right now: ${_hint}. What would help?`,
  ]), resume);
};

// activateVoiceAssistant — last, calls everything above ──
const activateVoiceAssistant = () => {
  if (!("speechSynthesis" in window)) {
    showToast("❌ Voice not supported in this browser.", "error"); return;
  }
  if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
    showToast("🎙️ Speech recognition needs Chrome or Brave.", "error"); return;
  }
  if (wakeWordRef.current) {
    try { wakeWordRef.current.abort(); } catch (_) {}
    try { wakeWordRef.current.stop();  } catch (_) {}
    wakeWordRef.current = null;
  }
  vaActiveRef.current  = true;
  hasSpokeRef.current  = true;
  setVoiceActive(true);

  const hr = new Date().getHours();
  const GREETINGS = {
    morning: [
      `Good morning Doctor ${docFirst}. I hope you slept well. ${todayAppts.length > 0 ? `You have ${todayAppts.length} patient${todayAppts.length !== 1 ? "s" : ""} today.` : "Your schedule looks clear today."} I am ready whenever you are.`,
      `Morning Doctor. Fresh start. Tell me what you need and I will handle it.`,
      `Good morning Doctor ${docFirst}. What are we doing today?`,
    ],
    afternoon: [
      `Good afternoon Doctor ${docFirst}. How is your day going? I am here if you need anything.`,
      `Afternoon Doctor. ${pendingAppts > 0 ? `${pendingAppts} appointments still need your attention.` : "Everything looks attended to."} What can I help with?`,
      `Hi Doctor ${docFirst}. I am listening — just say the word.`,
    ],
    evening: [
      `Good evening Doctor ${docFirst}. You have been working hard. What do you need?`,
      `Evening Doctor. I hope today was kind to you. What can I do?`,
      `Hi Doctor. Still here with you. What do you need tonight?`,
    ],
  };
  const pool        = hr < 12 ? GREETINGS.morning : hr < 17 ? GREETINGS.afternoon : GREETINGS.evening;
  const greetingMsg = pool[Math.floor(Math.random() * pool.length)];

  if (IS_IOS) {
    showToast("🎙️ iOS: tap Sara after each response to continue listening.", "success");
  }
  setTimeout(() => {
    speak(greetingMsg, () => {
      if (vaActiveRef.current) {
        setTimeout(() => startContinuousListeningRef.current?.(), 1200);
      }
    });
  }, 300);
};
  // Keep stable refs pointing to the latest closures after every render
  useEffect(() => {
    saraStartRecordingRef.current      = saraStartRecording;
    saraHandleCommandRef.current       = saraHandleCommand;
    activateVoiceAssistantRef.current  = activateVoiceAssistant;
    handleVoiceCommandRef.current      = handleVoiceCommand;
    startContinuousListeningRef.current = startContinuousListening;
    deactivateVoiceAssistantRef.current = deactivateVoiceAssistant;
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="dd">
        {/*  TOPBAR — matches Patient Dashboard exactly  */}
        <header className="dd-top">
          <div className="dd-top-l">
            <span className="dd-logo" style={{ fontStyle: "normal", color: "#fff", letterSpacing: "-0.5px" }}>
              Clini<em style={{ fontStyle: "italic", color: "#c9a84c" }}>qo</em>
            </span>
          </div>
          <div className="dd-top-r">
            
            {doctor && (
              <div className="dd-chip">
                <div className="dd-av">{docInitials}</div>
                <span className="dd-uname">
                  Dr. {docFirst} {docLast}
                </span>
              </div>
            )}
           
<button className="dd-logout" onClick={handleLogout}>
  Sign Out
</button>
          </div>
        </header>

        {/*  HERO same green gradient as Patient Dashboard  */}
        <section className="dd-hero">
          <div className="dd-hgrid" />
          <div className="dd-hinner">
            <div className={`dd-htxt ${heroVis ? "vis" : ""}`}>
              <div className="dd-htag">
                <span className="dd-htag-dot" />
                Doctor Portal
              </div>
              <h1>
                {greeting},<br />
                <em>Dr. {docFirst}!</em>
              </h1>
              <p>
                {docDept || "Medical Professional"} ·{" "}
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <div className={`dd-stats ${heroVis ? "vis" : ""}`}>
              {[
                {
                  val: apptLoading ? "…" : (() => {
                    const now = new Date();
                    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return appointments.filter((a) => {
                      const d = new Date(a.appointment_date);
                      return d >= now && d <= weekAhead &&
                        ["Pending","Accepted","Confirmed"].includes(a.status);
                    }).length;
                  })(),
                  lbl: "This Week",
                  tab: "appointments",
                },
                {
                  val: apptLoading ? "…" : appointments.filter(
                    (a) => a.status === "Pending"
                  ).length,
                  lbl: "Pending",
                  tab: "appointments",
                },
                {
                  val: apptLoading ? "…" : appointments.filter((a) =>
                    ["Confirmed", "Accepted"].includes(a.status)
                  ).length,
                  lbl: "Confirmed",
                  tab: "appointments",
                },
                {
                  val: apptLoading ? "…" : uniquePatients.length,
                  lbl: "Patients",
                  tab: "patients",
                },
                {
                  val: vcLoading ? "…" : pendingVC,
                  lbl: "Video Req",
                  tab: "videoconsult",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="dd-stat"
                  onClick={() => setActiveTab(s.tab)}
                >
                  <div className="dd-sv">{s.val}</div>
                  <div className="dd-sl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* identical markup & active style to Patient Dashboard  */}
        <div className="dd-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`dd-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && <span className="dd-tab-badge">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/*CONTENT */}
        <div className="dd-body">
          {/*  OVERVIEW  */}
          {activeTab === "overview" && (
            <div style={{ animation: "dd-up .4s ease" }}>
              {/* Stat cards */}
              <div className="dd-stats-grid">
                {[
                  {
                    emoji: "📅",
                    label: "Upcoming",
                    val: apptLoading ? "…" : (() => {
                      const now = new Date();
                      const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                      return appointments.filter((a) => {
                        const d = new Date(a.appointment_date);
                        return d >= now && d <= weekAhead &&
                          ["Pending","Accepted","Confirmed"].includes(a.status);
                      }).length;
                    })(),
                    sub: `${appointments.length} total`,
                    bg: "#eff6ff",
                    clr: "#1e40af",
                  },
                  {
                    emoji: "⏳",
                    label: "Pending Requests",
                    val: apptLoading ? "…" : pendingAppts,
                    sub: "Awaiting action",
                    bg: "#fffbeb",
                    clr: "#92400e",
                  },
                  {
                    emoji: "✅",
                    label: "Confirmed",
                    val: apptLoading ? "…" : confirmedAppts,
                    sub: "Ready to see",
                    bg: "#ecfdf5",
                    clr: "#065f46",
                  },
                  {
                    emoji: "🎉",
                    label: "Completed",
                    val: apptLoading ? "…" : completedAppts,
                    sub: "This period",
                    bg: "#f0fdf4",
                    clr: "#166534",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="dd-scard"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => setActiveTab("appointments")}
                  >
                    <div className="dd-scard-top">
                      <div
                        className="dd-scard-ico"
                        style={{ background: s.bg }}
                      >
                        {s.emoji}
                      </div>
                      <span className="dd-scard-val" style={{ color: s.clr }}>
                        {s.val}
                      </span>
                    </div>
                    <div className="dd-scard-label">{s.label}</div>
                    <div className="dd-scard-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr",
                  gap: 16,
                }}
              >
                {/* Recent appointments */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1.5px solid #e4edf5",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#1a3d2e",
                        }}
                      >
                        Recent Appointments
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#6b8fa0", marginTop: 2 }}
                      >
                        {appointments.length} total records
                      </div>
                    </div>
                    <button
                      className="dd-btn rx"
                      onClick={() => setActiveTab("appointments")}
                    >
                      View All
                    </button>
                  </div>
                  {apptLoading ? (
                    <div style={{ padding: 20 }}>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="dd-skel"
                          style={{ height: 52, marginBottom: 10 }}
                        />
                      ))}
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="dd-empty" style={{ padding: "36px 20px" }}>
                      <span className="dd-empty-icon">📭</span>
                      <p>No appointments yet</p>
                    </div>
                  ) : (
                    appointments.slice(0, 5).map((a) => {
                      const sm = APPT_STATUS[a.status] || APPT_STATUS.Pending;
                      return (
                        <div
                          key={a._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 20px 12px 24px",
                            borderBottom: "1px solid #f8fafc",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background .15s",
                          }}
                          onClick={() => setSelAppt(a)}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 3,
                              background: sm.strip,
                              borderRadius: "0 2px 2px 0",
                            }}
                          />
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: sm.bg,
                              border: `1px solid ${sm.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 17,
                              flexShrink: 0,
                            }}
                          >
                            {sm.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 13.5,
                                fontWeight: 700,
                                color: "#0f1f22",
                              }}
                            >
                              {a.firstName} {a.lastName}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b8fa0" }}>
                              {a.department} · {fmtDate(a.appointment_date)}
                            </div>
                          </div>
                          <div
                            className="dd-badge"
                            style={{
                              background: sm.bg,
                              color: sm.color,
                              borderColor: sm.border,
                            }}
                          >
                            <span
                              className="dd-dot"
                              style={{ background: sm.dot }}
                            />
                            {a.status}
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            {a.status === "Pending" && (
                              <button
                                className="dd-btn accept"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateApptStatus(a._id, "Accepted");
                                }}
                              >
                                Accept
                              </button>
                            )}
                            {(a.status === "Accepted" ||
                              a.status === "Confirmed") && (
                              <button
                                className="dd-btn complete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateApptStatus(a._id, "Completed");
                                }}
                              >
                                Complete
                              </button>
                            )}
                            {a.status === "Completed" && (
                              <button
                                className="dd-btn rx"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRxFor(a);
                                }}
                              >
                                💊 Rx
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Today's schedule */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1.5px solid #e4edf5",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#1a3d2e",
                      }}
                    >
                      Upcoming Schedule
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#6b8fa0", marginTop: 2 }}
                    >
                      {(() => {
                        const now = new Date();
                        const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return appointments.filter((a) => {
                          const d = new Date(a.appointment_date);
                          return d >= now && d <= weekAhead &&
                            ["Pending","Accepted","Confirmed"].includes(a.status);
                        }).length;
                      })()} patient{(() => {
                        const now = new Date();
                        const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return appointments.filter((a) => {
                          const d = new Date(a.appointment_date);
                          return d >= now && d <= weekAhead &&
                            ["Pending","Accepted","Confirmed"].includes(a.status);
                        }).length !== 1 ? "s" : "";
                      })()} this week
                    </div>
                  </div>
                  {(() => {
                    const now = new Date();
                    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const upcomingAppts = appointments
                      .filter((a) => {
                        const d = new Date(a.appointment_date);
                        return d >= now && d <= weekAhead &&
                          ["Pending","Accepted","Confirmed"].includes(a.status);
                      })
                      .sort((a, b) =>
                        new Date(a.appointment_date) - new Date(b.appointment_date)
                      );
                    return upcomingAppts.length === 0 ? (
                      <div
                        style={{
                          padding: "32px 20px",
                          textAlign: "center",
                          color: "#6b8fa0",
                          fontSize: 13,
                        }}
                      >
                        🎉 No appointments this week
                      </div>
                    ) : (
                      upcomingAppts.map((a, i) => {
                      const sm = APPT_STATUS[a.status] || APPT_STATUS.Pending;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "11px 16px",
                            borderBottom: "1px solid #f8fafc",
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: sm.dot,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0f1f22",
                            }}
                          >
                            {a.firstName} {a.lastName}
                          </span>
                          {a.appointment_time && (
                            <span style={{ fontSize: 11, color: "#6b8fa0" }}>
                              {a.appointment_time}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: sm.color,
                            }}
                          >
                            {a.status}
                          </span>
                        </div>
                      );
                    })
                    );
                  })()}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <button
                      className="dd-btn rx"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        padding: "8px",
                      }}
                      onClick={() => setActiveTab("prescription")}
                    >
                      💊 New Rx
                    </button>
                    <button
                      className="dd-btn video"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        padding: "8px",
                      }}
                      onClick={() => setActiveTab("videoconsult")}
                    >
                      🎥 Video
                    </button>
                  </div>
                </div>
              </div>

              {/* Pending video requests callout */}
              {pendingVC > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    background: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                    border: "1.5px solid #6ee7b7",
                    borderRadius: 14,
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveTab("videoconsult")}
                >
                  <span style={{ fontSize: 28 }}>🎥</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#065f46",
                        fontSize: 14,
                      }}
                    >
                      You have {pendingVC} pending video consultation request
                      {pendingVC !== 1 ? "s" : ""}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#047857", marginTop: 2 }}
                    >
                      Click to review and accept or reject
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: "#10b981" }}>→</span>
                </div>
              )}
            </div>
          )}

          {/*  APPOINTMENTS */}
          {activeTab === "appointments" && (
            <div style={{ animation: "dd-up .4s ease" }}>
              <div className="dd-sec-hd">
                <div>
                  <div className="dd-sec-title">Appointment Management</div>
                  <div className="dd-sec-sub">
                    {appointments.length} total · {pendingAppts} pending ·{" "}
                    {confirmedAppts} confirmed
                  </div>
                </div>
              </div>
              <div className="dd-filter">
                {[
                  "All",
                  "Pending",
                  "Accepted",
                  "Confirmed",
                  "Completed",
                  "Rejected",
                  "Cancelled",
                ].map((f) => (
                  <button
                    key={f}
                    className={`dd-fbtn ${apptFilter === f ? "on" : ""}`}
                    onClick={() => setApptFilter(f)}
                  >
                    {APPT_STATUS[f]?.icon || "📋"} {f}
                    {f !== "All" && (
                      <span className="dd-fc">
                        ({appointments.filter((a) => a.status === f).length})
                      </span>
                    )}
                  </button>
                ))}
                <button
                  className="dd-ref"
                  onClick={() => fetchAppointments(true)}
                  disabled={refreshing}
                >
                  <span
                    style={{
                      display: "inline-block",
                      animation: refreshing
                        ? "dd-spin .7s linear infinite"
                        : "none",
                    }}
                  >
                    ↻
                  </span>
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {apptLoading && (
                <div>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="dd-skel"
                      style={{ height: 72, marginBottom: 10 }}
                    />
                  ))}
                </div>
              )}

              {!apptLoading && filteredAppts.length === 0 && (
                <div className="dd-empty">
                  <span className="dd-empty-icon">📭</span>
                  <h3>
                    No {apptFilter !== "All" ? apptFilter : ""} Appointments
                  </h3>
                  <p>
                    No {apptFilter.toLowerCase()} appointments to show right
                    now.
                  </p>
                </div>
              )}

              {!apptLoading && filteredAppts.length > 0 && (
                <div className="dd-list">
                  {filteredAppts.map((a, i) => {
                    const sm = APPT_STATUS[a.status] || APPT_STATUS.Pending;
                    return (
                      <div
                        key={a._id}
                        className="dd-acard"
                        data-pending={a.status === "Pending" ? "true" : "false"}
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            background: sm.strip,
                          }}
                        />
                        <div className="dd-ainner" style={{ paddingLeft: 24 }}>
                          <div
                            className="dd-aico"
                            style={{
                              background: sm.bg,
                              border: `1px solid ${sm.border}`,
                              cursor: "pointer",
                            }}
                            onClick={() => setSelAppt(a)}
                          >
                            {sm.icon}
                          </div>
                          <div
                            className="dd-ainfo"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelAppt(a)}
                          >
                            <div className="dd-aname">
                              {a.firstName} {a.lastName}
                            </div>
                            <div className="dd-ameta">
                              {a.department}
                              {a.phone ? ` · ${a.phone}` : ""}
                            </div>
                            <div className="dd-ametarow">
                              <span className="dd-ami">
                                <IconCal /> {fmtDate(a.appointment_date)}
                              </span>
                              {a.appointment_time && (
                                <span className="dd-ami">
                                  <IconClk /> {a.appointment_time}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className="dd-badge"
                            style={{
                              background: sm.bg,
                              color: sm.color,
                              borderColor: sm.border,
                            }}
                          >
                            <span
                              className="dd-dot"
                              style={{ background: sm.dot }}
                            />
                            {a.status}
                          </div>
                          <div className="dd-actions">
                            {a.status === "Pending" && (
                              <>
                                <button
                                  className="dd-btn accept"
                                  onClick={() =>
                                    updateApptStatus(a._id, "Accepted")
                                  }
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  className="dd-btn reject"
                                  onClick={() =>
                                    updateApptStatus(a._id, "Rejected")
                                  }
                                >
                                  ✕ Reject
                                </button>
                              </>
                            )}
                            {(a.status === "Accepted" ||
                              a.status === "Confirmed") && (
                              <>
                                <button
                                  className="dd-btn complete"
                                  onClick={() =>
                                    updateApptStatus(a._id, "Completed")
                                  }
                                >
                                  ✓ Complete
                                </button>
                                <button
                                  className="dd-btn cancel"
                                  onClick={() =>
                                    updateApptStatus(a._id, "Cancelled")
                                  }
                                >
                                  ✕ Cancel
                                </button>
                              </>
                            )}
                            {a.status === "Completed" && (
                              <button
                                className="dd-btn rx"
                                onClick={() => openRxFor(a)}
                              >
                                💊 Write Rx
                              </button>
                            )}
                          </div>
                        </div>
                        {(a.status === "Accepted" ||
                          a.status === "Rejected") && (
                          <div
                            className="dd-banner"
                            style={{
                              background:
                                a.status === "Accepted" ? "#ecfdf5" : "#fef2f2",
                              borderColor:
                                a.status === "Accepted" ? "#6ee7b7" : "#fecaca",
                              color:
                                a.status === "Accepted" ? "#065f46" : "#991b1b",
                            }}
                          >
                            {a.status === "Accepted"
                              ? "✅ Appointment accepted — please arrive on time."
                              : "❌ Appointment rejected — patient has been notified."}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PATIENTS  */}
          {activeTab === "patients" && (
            <div style={{ animation: "dd-up .4s ease" }}>
              <div className="dd-sec-hd">
                <div>
                  <div className="dd-sec-title">Your Patients</div>
                  <div className="dd-sec-sub">
                    {uniquePatients.length} unique patient
                    {uniquePatients.length !== 1 ? "s" : ""} from appointments
                  </div>
                </div>
              </div>
              <div className="dd-search-wrap">
                <span className="dd-search-ico">
                  <IconSearch />
                </span>
                <input
                  className="dd-search"
                  placeholder="Search patients or departments…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              {apptLoading && (
                <div>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="dd-skel"
                      style={{ height: 60, marginBottom: 10 }}
                    />
                  ))}
                </div>
              )}
              {!apptLoading && filteredPatients.length === 0 && (
                <div className="dd-empty">
                  <span className="dd-empty-icon">👥</span>
                  <h3>No Patients Found</h3>
                  <p>Try adjusting your search term.</p>
                </div>
              )}
              {!apptLoading && filteredPatients.length > 0 && (
                <div className="dd-list">
                  {filteredPatients.map((p, i) => (
                    <div
                      key={p.id}
                      className="dd-acard"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          background: "#10b981",
                        }}
                      />
                      <div className="dd-ainner" style={{ paddingLeft: 24 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background:
                              "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                            color: "#065f46",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {p.initials}
                        </div>
                        <div className="dd-ainfo">
                          <div className="dd-aname">{p.name}</div>
                          <div className="dd-ameta">{p.dept}</div>
                          <div className="dd-ametarow">
                            <span className="dd-ami">
                              <IconCal /> Last visit: {p.lastVisit}
                            </span>
                            {p.email && (
                              <span className="dd-ami">✉ {p.email}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="dd-btn rx"
                          onClick={() => {
                            setRxForm((f) => ({
                              ...f,
                              patientName: p.name,
                              patientEmail: p.email || "",
                            }));
                            setActiveTab("prescription");
                            showToast(`Opened Rx for ${p.name}`);
                          }}
                        >
                          💊 Prescribe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRESCRIPTION*/}
          {activeTab === "prescription" && (
            <div style={{ animation: "dd-up .4s ease", maxWidth: 780 }}>
              {/* Pulse animation for mic */}
              <style>{`
      @keyframes micPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.5; transform: scale(1.15); }
      }
    `}</style>

              <div className="dd-rx-wrap">
                <div className="dd-rx-hd">
                  <h2>{rxEditMode ? "✏️ Edit Prescription" : "💊 Prescription Builder"}</h2>
                  <p>
                    {rxEditMode
                      ? `Editing prescription for ${rxForm.patientName} — changes are saved immediately`
                      : "Saved prescriptions appear in the patient's dashboard immediately"}
                  </p>
                </div>
                <div className="dd-rx-body">
                  <div className="dd-field-grid">
                    <div>
                      <label className="dd-label">Patient Name *</label>
                      <input
                        className="dd-input"
                        value={rxForm.patientName}
                        onChange={(e) =>
                          setRxForm((f) => ({
                            ...f,
                            patientName: e.target.value,
                          }))
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="dd-label">Age</label>
                      <input
                        className="dd-input"
                        value={rxForm.patientAge}
                        onChange={(e) =>
                          setRxForm((f) => ({
                            ...f,
                            patientAge: e.target.value,
                          }))
                        }
                        placeholder="Years"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label className="dd-label">Patient Email</label>
                    <input
                      className="dd-input"
                      value={rxForm.patientEmail}
                      onChange={(e) =>
                        setRxForm((f) => ({
                          ...f,
                          patientEmail: e.target.value,
                        }))
                      }
                      placeholder="patient@email.com"
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label className="dd-label">Diagnosis *</label>
                    <input
                      className="dd-input"
                      value={rxForm.diagnosis}
                      onChange={(e) =>
                        setRxForm((f) => ({ ...f, diagnosis: e.target.value }))
                      }
                      placeholder="Primary diagnosis"
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <label className="dd-label" style={{ margin: 0 }}>
                      Medications *
                    </label>
                    <button className="dd-btn rx" onClick={addDrug}>
                      + Add Drug
                    </button>
                  </div>

                  {rxForm.drugs.map((drug, i) => (
                    <div key={i} className="dd-drug-row">
                      {[
                        ["name", "Drug Name"],
                        ["dose", "Dose"],
                        ["frequency", "Frequency"],
                        ["duration", "Duration"],
                      ].map(([field, ph]) => (
                        <input
                          key={field}
                          className="dd-input"
                          style={{
                            flex: field === "name" ? 2 : 1,
                            minWidth: 80,
                          }}
                          value={drug[field]}
                          onChange={(e) => updateDrug(i, field, e.target.value)}
                          placeholder={ph}
                        />
                      ))}
                      {rxForm.drugs.length > 1 && (
                        <button
                          className="dd-drug-del"
                          onClick={() => removeDrug(i)}
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  ))}

                  {/*  NOTES & INSTRUCTIONS WITH VOICE  */}
                  <div style={{ marginTop: 16, marginBottom: 20 }}>
                    {/* Label + Mic button row */}
                    {!browserSupportsSpeechRecognition && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 14px",
                          marginBottom: 10,
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          borderRadius: 9,
                          fontSize: 12.5,
                          color: "#92400e",
                        }}
                      >
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        <div>
                          <strong>Voice input not available</strong> — your
                          browser doesn't support speech recognition. Please use{" "}
                          <strong>Chrome</strong> or <strong>Edge</strong> for
                          voice features.
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 7,
                      }}
                    >
                      <label className="dd-label" style={{ margin: 0 }}>
                        Notes & Instructions
                      </label>
                      <button
                        type="button"
                        onClick={
                            voiceActive
                              ? () => showToast("Sara is active — say: add note, followed by your text.", "error")
                              : toggleVoice
                          }
                        title={
                          voiceActive
                            ? "Sara is active — say 'add note: [your text]' instead"
                            : !browserSupportsSpeechRecognition
                              ? "⚠️ Voice not supported. Please use Chrome or Edge."
                              : isListening
                                ? "Stop recording"
                                : "Speak to fill notes"
                        }
                    
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 14px",
                          borderRadius: 999,
                          border: !browserSupportsSpeechRecognition
                            ? "1.5px solid #d1d5db"
                            : isListening
                              ? "1.5px solid #dc2626"
                              : "1.5px solid #1a3d2e",
                          background: !browserSupportsSpeechRecognition
                            ? "#f3f4f6"
                            : isListening
                              ? "#fef2f2"
                              : "rgba(26,61,46,.07)",
                          color: !browserSupportsSpeechRecognition
                            ? "#9ca3af"
                            : isListening
                              ? "#dc2626"
                              : "#1a3d2e",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: !browserSupportsSpeechRecognition
                            ? "not-allowed"
                            : "pointer",
                          transition: "all .2s",
                          fontFamily: "inherit",
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={
                            isListening
                              ? {
                                  animation:
                                    "micPulse .8s ease-in-out infinite",
                                }
                              : {}
                          }
                        >
                          <rect x="9" y="2" width="6" height="12" rx="3" />
                          <path d="M5 10a7 7 0 0 0 14 0" />
                          <line x1="12" y1="19" x2="12" y2="22" />
                          <line x1="9" y1="22" x2="15" y2="22" />
                        </svg>
                        {!browserSupportsSpeechRecognition
                          ? "Not Available"
                          : isListening
                            ? "Stop"
                            : "Speak"}
                        {isListening && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#dc2626",
                              display: "inline-block",
                              animation: "micPulse .8s ease-in-out infinite",
                            }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Listening status bar */}
                    {isListening && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 12px",
                          marginBottom: 8,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#dc2626",
                        }}
                      >
                        <span
                          style={{
                            animation: "micPulse .8s ease-in-out infinite",
                            fontSize: 14,
                          }}
                        >
                          🎙️
                        </span>
                        Listening… speak clearly. Click{" "}
                        <strong style={{ margin: "0 3px" }}>Stop</strong> when
                        done.
                      </div>
                    )}

                    <textarea
                      className="dd-input"
                      value={rxForm.notes}
                      onChange={(e) =>
                        setRxForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder={
                        isListening
                          ? "🎙️ Listening… start speaking now"
                          : "Additional instructions, follow-up details… or use 🎙️ Speak"
                      }
                      rows={4}
                      style={{
                        resize: "vertical",
                        borderColor: isListening ? "#fca5a5" : undefined,
                        boxShadow: isListening
                          ? "0 0 0 3px rgba(220,38,38,.1)"
                          : undefined,
                        transition: "border-color .2s, box-shadow .2s",
                      }}
                    />
                  </div>

                  <div className="dd-rx-actions">
                    <button
                      className="dd-rx-btn save"
                      onClick={rxEditMode ? saveRxEdit : saveRx}
                      disabled={rxSaving}
                    >
                      {rxSaving ? (
                        <>
                          <span className="dd-spin" />
                          {rxEditMode ? "Updating…" : "Saving…"}
                        </>
                      ) : (
                        <>
                          <IconSave />
                          {rxEditMode ? "Update Prescription" : "Save for Patient"}
                        </>
                      )}
                    </button>
                    {rxEditMode && (
                      <button
                        className="dd-rx-btn print"
                        style={{ background: "#fef2f2", color: "#991b1b", border: "1.5px solid #fecaca" }}
                        onClick={() => {
                          setRxEditMode(false);
                          setRxEditId(null);
                          setRxForm({
                            appointmentId: "", patientId: "", patientName: "", patientAge: "",
                            patientEmail: "", diagnosis: "",
                            drugs: [{ name: "", dose: "", frequency: "", duration: "" }], notes: "",
                          });
                        }}
                      >
                        ✕ Cancel Edit
                      </button>
                    )}
                    {!rxEditMode && (
                      <button
                        className="dd-rx-btn print"
                        onClick={() => showToast("PDF print coming soon")}
                      >
                        <IconPrint /> Print PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {rxHistory.length > 0 && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1.5px solid #e4edf5",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                    marginTop: 20,
                  }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#1a3d2e",
                      }}
                    >
                      Prescription History
                    </div>
                    <div style={{ fontSize: 12, color: "#6b8fa0" }}>
                      {rxHistory.length} total
                    </div>
                  </div>
                  {rxHistory.slice(0, 10).map((rx) => (
                    <div
                      key={rx._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "13px 20px",
                        borderBottom: "1px solid #f8fafc",
                        background: rxEditId === rx._id ? "#f0fdf4" : "transparent",
                        transition: "background .2s",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          background: rxEditId === rx._id ? "#dcfce7" : "#ecfdf5",
                          border: `1px solid ${rxEditId === rx._id ? "#22c55e" : "#6ee7b7"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {rxEditId === rx._id ? "✏️" : "💊"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1f22" }}>
                          {rx.patientName}
                          {rxEditId === rx._id && (
                            <span style={{
                              marginLeft: 8, fontSize: 10, fontWeight: 700,
                              background: "#dcfce7", color: "#166534",
                              border: "1px solid #bbf7d0", borderRadius: 999,
                              padding: "1px 8px",
                            }}>
                              Editing
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b8fa0" }}>
                          {rx.diagnosis} · {rx.drugs?.length || 0} drug
                          {rx.drugs?.length !== 1 ? "s" : ""} · {fmtDate(rx.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          className="dd-btn rx"
                          style={{ padding: "5px 11px", fontSize: 12 }}
                          onClick={() => setRxViewModal(rx)}
                        >
                          👁 View
                        </button>
                        <button
                          className="dd-btn complete"
                          style={{ padding: "5px 11px", fontSize: 12 }}
                          onClick={() => openRxEdit(rx)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="dd-btn reject"
                          style={{ padding: "5px 11px", fontSize: 12 }}
                          onClick={() => setRxDeleteConfirm(rx)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VIEW MODAL */}
              {rxViewModal && (
                <div className="dd-ov" onClick={() => setRxViewModal(null)}>
                  <div className="dd-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                    <div className="dd-modal-hd">
                      <h3>💊 Prescription Details</h3>
                      <p>Issued on {fmtDate(rxViewModal.createdAt)}</p>
                    </div>
                    <div className="dd-modal-body">
                      {[
                        { ico: "👤", lbl: "Patient", val: rxViewModal.patientName },
                        { ico: "🎂", lbl: "Age", val: rxViewModal.patientAge || "—" },
                        { ico: "✉", lbl: "Email", val: rxViewModal.patientEmail || "—" },
                        { ico: "🩺", lbl: "Diagnosis", val: rxViewModal.diagnosis },
                        { ico: "📅", lbl: "Date", val: fmtDate(rxViewModal.createdAt) },
                      ].map((row, i) => (
                        <div key={i} className="dd-modal-row">
                          <div className="dd-modal-ico">{row.ico}</div>
                          <div>
                            <strong>{row.lbl}</strong>
                            <span>{row.val}</span>
                          </div>
                        </div>
                      ))}
                      <div style={{ padding: "10px 0" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#6b8fa0", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>
                          Medications
                        </div>
                        {rxViewModal.drugs?.map((d, i) => (
                          <div key={i} style={{
                            display: "flex", gap: 8, flexWrap: "wrap",
                            padding: "7px 10px", background: "#f8fafc",
                            borderRadius: 9, marginBottom: 6,
                            border: "1px solid #e4edf5", fontSize: 13,
                          }}>
                            <span style={{ fontWeight: 700, color: "#0f1f22" }}>💊 {d.name}</span>
                            {d.dose && <span style={{ color: "#6b8fa0" }}>· {d.dose}</span>}
                            {d.frequency && <span style={{ color: "#6b8fa0" }}>· {d.frequency}</span>}
                            {d.duration && <span style={{ color: "#6b8fa0" }}>· {d.duration}</span>}
                          </div>
                        ))}
                      </div>
                      {rxViewModal.notes && (
                        <div style={{
                          padding: "10px 12px", background: "#fffbeb",
                          border: "1px solid #fde68a", borderRadius: 9,
                          fontSize: 13, color: "#92400e", lineHeight: 1.6,
                        }}>
                          📝 {rxViewModal.notes}
                        </div>
                      )}
                    </div>
                    <div className="dd-modal-foot">
                      <button className="dd-modal-cancel" onClick={() => setRxViewModal(null)}>Close</button>
                      <button className="dd-btn complete" style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => { openRxEdit(rxViewModal); setRxViewModal(null); }}>
                        ✏️ Edit This
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DELETE CONFIRM MODAL */}
              {rxDeleteConfirm && (
                <div className="dd-ov" onClick={() => setRxDeleteConfirm(null)}>
                  <div className="dd-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                    <div className="dd-modal-hd">
                      <h3>🗑 Delete Prescription</h3>
                      <p>This action cannot be undone</p>
                    </div>
                    <div className="dd-modal-body">
                      <div style={{
                        padding: "16px", background: "#fef2f2",
                        border: "1px solid #fecaca", borderRadius: 12,
                        fontSize: 14, color: "#991b1b", lineHeight: 1.6,
                      }}>
                        Are you sure you want to delete the prescription for <strong>{rxDeleteConfirm.patientName}</strong>?
                        <br/>
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                          Diagnosis: {rxDeleteConfirm.diagnosis} · {fmtDate(rxDeleteConfirm.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="dd-modal-foot">
                      <button className="dd-modal-cancel" onClick={() => setRxDeleteConfirm(null)}>
                        Cancel
                      </button>
                      <button
                        className="dd-btn reject"
                        style={{ flex: 1, justifyContent: "center", padding: "9px" }}
                        onClick={() => deleteRx(rxDeleteConfirm._id)}
                        disabled={rxDeleting}
                      >
                        {rxDeleting ? <><span className="dd-spin"/> Deleting…</> : "🗑 Yes, Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIDEO CONSULTATION  */}
          {activeTab === "videoconsult" && (
            <div style={{ animation: "dd-up .4s ease" }}>
              <div className="dd-vc-banner">
                <div>
                 <div className="dd-vc-num">{vcLoading ? "…" : vcRequests.length}</div>
              <div className="dd-vc-lbl">Total Requests</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 18,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    Video Consultation Requests
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>
                    Accept to notify the patient in real-time. Start the call
                    from here once accepted.
                  </div>
                </div>
                <button
                  className="dd-btn rx"
                  onClick={fetchVcRequests}
                  style={{
                    flexShrink: 0,
                    borderColor: "rgba(255,255,255,.3)",
                    background: "rgba(255,255,255,.1)",
                    color: "#fff",
                  }}
                >
                  ↺ Refresh
                </button>
              </div>

              {/* Status pills */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                {/* All pill */}
              <div
                className="dd-badge"
                style={{
                  background: vcFilter === "All" ? "#1a3d2e" : "#f9fafb",
                  color: vcFilter === "All" ? "#fff" : "#374151",
                  borderColor: vcFilter === "All" ? "#1a3d2e" : "#d1d5db",
                  cursor: "pointer",
                  fontWeight: 700,
                  transition: "all .18s",
                  transform: vcFilter === "All" ? "scale(1.05)" : "scale(1)",
                }}
                onClick={() => setVcFilter("All")}
              >
                All
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  ({vcRequests.length})
                </span>
              </div>

              {/* Per-status pills — only show statuses that have at least 1 request */}
              {Object.entries(VC_STATUS)
                .map(([status, s]) => ({
                  status,
                  s,
                  count: vcRequests.filter((r) => r.status === status).length,
                }))
                .filter(({ count }) => count > 0)
                .map(({ status, s, count }) => (
                  <div
                    key={status}
                    className="dd-badge"
                    style={{
                      background: vcFilter === status ? s.dot : s.bg,
                      color: vcFilter === status ? "#fff" : s.color,
                      borderColor: vcFilter === status ? s.dot : s.border,
                      cursor: "pointer",
                      fontWeight: 700,
                      transition: "all .18s",
                      transform: vcFilter === status ? "scale(1.07)" : "scale(1)",
                      boxShadow: vcFilter === status
                        ? `0 2px 10px ${s.dot}55`
                        : "none",
                    }}
                    onClick={() =>
                      setVcFilter((prev) => (prev === status ? "All" : status))
                    }
                  >
                    <span
                      className="dd-dot"
                      style={{
                        background: vcFilter === status ? "#fff" : s.dot,
                      }}
                    />
                    {status}
                    <span style={{ marginLeft: 4, opacity: 0.75 }}>
                      ({count})
                    </span>
                  </div>
                ))}
              </div>

              {vcLoading && (
                <div>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="dd-skel"
                      style={{ height: 90, marginBottom: 10 }}
                    />
                  ))}
                </div>
              )}

              {!vcLoading && vcRequests.length === 0 && (
                <div className="dd-empty">
                  <span className="dd-empty-icon">🎥</span>
                  <h3>No Video Requests Yet</h3>
                  <p>
                    Video consultation requests from patients will appear here
                    in real-time.
                  </p>
                </div>
              )}

              {!vcLoading && vcRequests.length > 0 && (
                <div className="dd-list">
                  {(vcRequests.filter((r) =>
                    vcFilter === "All" ? true : r.status === vcFilter
                  )).map((vc, i) => {
                    const s = VC_STATUS[vc.status] || VC_STATUS.Pending;
                    return (
                      <div
                        key={vc._id}
                        className="dd-acard"
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            background: s.dot,
                          }}
                        />
                        <div className="dd-ainner" style={{ paddingLeft: 24 }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 13,
                              background: s.bg,
                              border: `1px solid ${s.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 22,
                              flexShrink: 0,
                              fontWeight: 800,
                              color: s.color,
                            }}
                          >
                            {vc.patientName?.[0] || "P"}
                          </div>
                          <div className="dd-ainfo">
                            <div className="dd-aname">{vc.patientName}</div>
                            <div className="dd-ameta">
                              {vc.patientEmail || ""}
                            </div>
                            <div className="dd-ametarow">
                              <span className="dd-ami">
                                <IconCal /> Requested:{" "}
                                {fmtDateTime(vc.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div
                            className="dd-badge"
                            style={{
                              background: s.bg,
                              color: s.color,
                              borderColor: s.border,
                            }}
                          >
                            <span
                              className="dd-dot"
                              style={{ background: s.dot }}
                            />
                            {vc.status}
                          </div>
                          <div className="dd-actions">
                            {["Pending", "Ringing"].includes(vc.status) && (
                              <>
                                <button
                                  className="dd-btn accept"
                                  onClick={() => acceptVC(vc._id)}
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  className="dd-btn reject"
                                  onClick={() => rejectVC(vc._id)}
                                >
                                  ✕ Reject
                                </button>
                              </>
                            )}
                            {vc.status === "Accepted" && (
                              <button
                                className="dd-btn video"
                                onClick={() => startVideoCall(vc)}
                              >
                                🎥 Start Call
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/*  AI ASSISTANT  */}
          {activeTab === "ai" && (
            <div style={{ animation: "dd-up .4s ease" }}>
              <div className="dd-sec-hd">
                <div>
                  <div className="dd-sec-title">AI Clinical Assistant</div>
                  <div className="dd-sec-sub">
                    Symptom analysis · Drug interactions · Clinical protocols
                  </div>
                </div>
              </div>
              <div className="dd-ai-grid">
                {/* Symptom analyser */}
                <div className="dd-ai-card">
                  <div className="dd-ai-hd">
                    <h3>🔬 Symptom Analyser</h3>
                    <p>
                      AI-powered differential diagnosis — real symptoms only
                    </p>
                  </div>
                  <div className="dd-ai-body">
                    {/* Suggestion chips */}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      {[
                        "Fever and cough for 3 days",
                        "Chest pain while breathing",
                        "Headache and dizziness since morning",
                        "Nausea and vomiting after meals",
                        "Knee pain and joint stiffness",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => fillSuggestion(s)}
                          style={{
                            padding: "4px 11px",
                            borderRadius: 999,
                            border: "1.5px solid #6ee7b7",
                            background:
                              aiSymptoms === s ? "#1a3d2e" : "#f0fdf4",
                            color: aiSymptoms === s ? "#fff" : "#166534",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            transition: "all .15s",
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Textarea with live border colour */}
                    <textarea
                      className="dd-input"
                      value={aiSymptoms}
                      onChange={handleAiSymptomsChange}
                      placeholder="e.g. 38-yr-old male, 3-day fever 39°C, productive cough with yellow sputum…"
                      rows={4}
                      style={{
                        resize: "none",
                        borderColor:
                          aiSymptoms.trim().length > 0
                            ? aiInputValid
                              ? "#10b981"
                              : "#f87171"
                            : "#e4edf5",
                        transition: "border-color .2s",
                      }}
                    />

                    {/* Live hint */}
                    {aiSymptoms.trim().length > 0 && !aiInputValid && (
                      <div
                        style={{ marginTop: 6, fontSize: 12, color: "#dc2626" }}
                      >
                        ⚠️ No recognisable symptoms — try keywords like{" "}
                        <em>fever, pain, cough…</em>
                      </div>
                    )}
                    {aiSymptoms.trim().length > 0 && aiInputValid && (
                      <div
                        style={{ marginTop: 6, fontSize: 12, color: "#059669" }}
                      >
                        ✅ Symptoms detected — ready to analyse
                      </div>
                    )}

                    {/* Button */}
                    <button
                      onClick={analyseSymptoms}
                      disabled={aiLoading || !aiInputValid}
                      style={{
                        width: "100%",
                        marginTop: 12,
                        padding: "11px",
                        borderRadius: 10,
                        border: "none",
                        background: !aiInputValid
                          ? "#cbd5e1"
                          : aiLoading
                            ? "#94a3b8"
                            : "linear-gradient(135deg,#1a3d2e,#2d6a4f)",
                        color: !aiInputValid ? "#94a3b8" : "#fff",
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor:
                          !aiInputValid || aiLoading
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        transition: "all .18s",
                      }}
                    >
                      {aiLoading ? (
                        <>
                          <span className="dd-spin" />
                          Analysing…
                        </>
                      ) : !aiInputValid ? (
                        "⚠️ Enter valid symptoms to analyse"
                      ) : (
                        "🔍 Analyse Symptoms"
                      )}
                    </button>

                    {/* Error box */}
                    {aiError && !aiLoading && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: "12px 14px",
                          background: "#fef2f2",
                          border: "1.5px solid #fecaca",
                          borderRadius: 10,
                          fontSize: 13,
                          color: "#991b1b",
                          display: "flex",
                          gap: 8,
                          lineHeight: 1.6,
                        }}
                      >
                        <span>❌</span>
                        <div>
                          <strong>Invalid Input</strong>
                          <br />
                          {aiError}
                        </div>
                      </div>
                    )}

                    {/* Results */}
                    {aiResult && !aiError && (
                      <div style={{ marginTop: 16 }}>
                        <div
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            marginBottom: 12,
                            background:
                              aiResult.urgency === "Emergency"
                                ? "#fef2f2"
                                : aiResult.urgency === "Urgent"
                                  ? "#fff7ed"
                                  : aiResult.urgency === "Semi-urgent"
                                    ? "#fffbeb"
                                    : "#ecfdf5",
                            border: `1px solid ${aiResult.urgencyColor || "#fde68a"}`,
                            color:
                              aiResult.urgency === "Emergency"
                                ? "#991b1b"
                                : aiResult.urgency === "Urgent"
                                  ? "#9a3412"
                                  : aiResult.urgency === "Semi-urgent"
                                    ? "#92400e"
                                    : "#065f46",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          ⚡ Urgency: {aiResult.urgency}
                        </div>
                        {aiResult.conditions.map((c, i) => (
                          <div key={i} className="dd-dx-row">
                            <span
                              style={{
                                flex: 1,
                                fontWeight: 600,
                                color: "#0f1f22",
                              }}
                            >
                              {c.name}
                              {c.icd10 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "#94a3b8",
                                    marginLeft: 6,
                                  }}
                                >
                                  {c.icd10}
                                </span>
                              )}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 9px",
                                borderRadius: 999,
                                background:
                                  c.likelihood === "High"
                                    ? "#fef2f2"
                                    : c.likelihood === "Medium"
                                      ? "#fffbeb"
                                      : "#ecfdf5",
                                color:
                                  c.likelihood === "High"
                                    ? "#dc2626"
                                    : c.likelihood === "Medium"
                                      ? "#d97706"
                                      : "#059669",
                              }}
                            >
                              {c.likelihood}
                            </span>
                          </div>
                        ))}
                        {aiResult.redFlags?.length > 0 && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: "10px 12px",
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: 9,
                              fontSize: 12.5,
                            }}
                          >
                            <strong style={{ color: "#991b1b" }}>
                              🚨 Red Flags:
                            </strong>
                            <ul
                              style={{
                                margin: "4px 0 0 16px",
                                padding: 0,
                                color: "#7f1d1d",
                                lineHeight: 1.7,
                              }}
                            >
                              {aiResult.redFlags.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiResult.management && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 12,
                              background: "#f0fdf4",
                              borderRadius: 9,
                              fontSize: 12.5,
                              color: "#374151",
                              lineHeight: 1.7,
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <strong>Management:</strong> {aiResult.management}
                          </div>
                        )}
                        {aiResult.tests?.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              marginTop: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            {aiResult.tests.map((t, i) => (
                              <span key={i} className="dd-test-tag">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: 12,
                            fontSize: 11,
                            color: "#94a3b8",
                            fontStyle: "italic",
                          }}
                        >
                          ⚠️ AI-generated — always apply clinical judgement.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat assistant */}
                <div className="dd-ai-card dd-chat-wrap">
                  <div className="dd-chat-hd">
                    <h3>🤖 AI Medical Assistant</h3>
                    <p>Ask about drugs, protocols, or clinical guidelines</p>
                  </div>
                  <div className="dd-chat-body">
                    {aiMessages.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignSelf:
                            m.from === "doctor" ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          className={`dd-bubble ${m.from}`}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              m.text
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                .replace(/^- (.+)/gm, "<li>$1</li>")
                                .replace(
                                  /(<li>.*<\/li>)/s,
                                  "<ul style='margin:6px 0 0 16px;padding:0'>$1</ul>",
                                )
                                .replace(/\n/g, "<br/>"),
                              { ALLOWED_TAGS: ["strong", "em", "ul", "li", "br"], ALLOWED_ATTR: ["style"] }
                            )
                          }}
                        />
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="dd-chat-input">
                    <input
                      className="dd-input"
                      style={{ flex: 1 }}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
                      placeholder="Ask about drugs, interactions, protocols…"
                    />
                    <button className="dd-chat-send" onClick={sendAiMessage}>
                      <IconSend />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS  */}
          {activeTab === "notifications" && (
            <div style={{ animation: "dd-up .4s ease" }}>
              <div className="dd-sec-hd">
                <div>
                  <div className="dd-sec-title">Notifications</div>
                  <div className="dd-sec-sub">{unreadNotifs} unread</div>
                </div>
                {unreadNotifs > 0 && (
                  <button
                    className="dd-btn complete"
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, read: true })),
                      )
                    }
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="dd-notif-card">
                {notifications.length === 0 ? (
                  <div className="dd-empty" style={{ padding: "40px 20px" }}>
                    <span className="dd-empty-icon">🔔</span>
                    <p>
                      No notifications yet — they appear here when patients book
                      or request consultations
                    </p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={n.id || i}
                      className={`dd-notif-row ${!n.read ? "unread" : ""}`}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((x) =>
                            x.id === n.id ? { ...x, read: true } : x,
                          ),
                        )
                      }
                    >
                      <div
                        className="dd-notif-ico"
                        style={{
                          background:
                            n.type === "video" ? "#f0fdf4" : "#eff6ff",
                        }}
                      >
                        {n.type === "video" ? "🎥" : "📅"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: n.read ? 400 : 700,
                            color: "#0f1f22",
                          }}
                        >
                          {n.text}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b8fa0",
                            marginTop: 3,
                          }}
                        >
                          {fmtTimeAgo(n.time)}
                        </div>
                      </div>
                      {!n.read && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#22c55e",
                            flexShrink: 0,
                            marginTop: 4,
                          }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/*  PROFILE */}
          {activeTab === "profile" && (
            <div
              style={{ animation: "dd-up .4s ease" }}
              className="dd-profile-wrap"
            >
              <div className="dd-profile-card">
                <div className="dd-profile-hd">
                  <h2>Profile & Settings</h2>
                </div>
                <div className="dd-profile-body">
                  <div className="dd-profile-banner">
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "linear-gradient(135deg,#c9a84c,#e8cc80)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, fontWeight: 800, color: "#0a1f14", flexShrink: 0,
                    }}>
                      {`${profile.firstName?.[0] || "D"}${profile.lastName?.[0] || ""}`.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#0f1f22" }}>
                        Dr. {profile.firstName || "—"} {profile.lastName || ""}
                      </div>
                      <div style={{ fontSize: 13, color: "#1a3d2e", marginTop: 2 }}>
                        {profile.department || "Department not set"}
                      </div>
                      {profile.email && (
                        <div style={{ fontSize: 12, color: "#6b8fa0", marginTop: 2 }}>
                          ✉ {profile.email}
                        </div>
                      )}
                      {profile.phone && (
                        <div style={{ fontSize: 12, color: "#6b8fa0", marginTop: 1 }}>
                          📞 {profile.phone}
                        </div>
                      )}
                      {profile.bio && (
                        <div style={{
                          fontSize: 12, color: "#4a6572", marginTop: 5,
                          fontStyle: "italic", lineHeight: 1.5,
                          maxWidth: 320,
                        }}>
                          "{profile.bio}"
                        </div>
                      )}
                      <div className="dd-status-pill" style={{ marginTop: 5 }}>
                        <span className="dd-status-dot" />
                        Available for Appointments
                      </div>
                    </div>
                  </div>
                  <div className="dd-field-grid" style={{ marginBottom: 14 }}>
                    {[
                      ["First Name", "firstName"],
                      ["Last Name", "lastName"],
                      ["Email", "email"],
                      ["Phone", "phone"],
                    ].map(([label, field]) => (
                      <div key={field}>
                        <label className="dd-label">{label}</label>
                        <input
                          className="dd-input"
                          value={profile[field]}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              [field]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="dd-label">Department</label>
                    <input
                      className="dd-input"
                      value={profile.department}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          department: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div style={{ marginBottom: 22 }}>
                    <label className="dd-label">Professional Bio</label>
                    <textarea
                      className="dd-input"
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, bio: e.target.value }))
                      }
                      rows={3}
                      style={{ resize: "vertical" }}
                    />
                  </div>
                  <button
                    className="dd-rx-btn save"
                    style={{ maxWidth: 220 }}
                    onClick={saveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? (
                      <>
                        <span className="dd-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <IconSave />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* /dd-body */}
      </div>
      

      {/* APPOINTMENT DETAIL MODAL  */}
      {selAppt &&
        (() => {
          const sm = APPT_STATUS[selAppt.status] || APPT_STATUS.Pending;
          return (
            <div className="dd-ov" onClick={() => setSelAppt(null)}>
              <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dd-modal-hd">
                  <h3>Appointment Details</h3>
                  <p>Booked on {fmtDate(selAppt.createdAt)}</p>
                </div>
                <div className="dd-modal-body">
                  {[
                    {
                      ico: "👤",
                      lbl: "Patient",
                      val: `${selAppt.firstName} ${selAppt.lastName}`,
                    },
                    { ico: "🏥", lbl: "Department", val: selAppt.department },
                    {
                      ico: "📅",
                      lbl: "Date",
                      val: fmtDate(selAppt.appointment_date),
                    },
                    {
                      ico: "🕐",
                      lbl: "Time",
                      val: selAppt.appointment_time || "Not specified",
                    },
                    { ico: "📞", lbl: "Phone", val: selAppt.phone || "—" },
                    { ico: "✉", lbl: "Email", val: selAppt.email || "—" },
                    {
                      ico: sm.icon,
                      lbl: "Status",
                      val: (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "2px 10px",
                            borderRadius: 999,
                            fontWeight: 700,
                            background: sm.bg,
                            color: sm.color,
                            border: `1px solid ${sm.border}`,
                            fontSize: 12,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: sm.dot,
                              display: "inline-block",
                            }}
                          />
                          {selAppt.status}
                        </span>
                      ),
                    },
                  ].map((row, i) => (
                    <div key={i} className="dd-modal-row">
                      <div className="dd-modal-ico">{row.ico}</div>
                      <div>
                        <strong>{row.lbl}</strong>
                        <span>{row.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dd-modal-foot">
                  <button
                    className="dd-modal-cancel"
                    onClick={() => setSelAppt(null)}
                  >
                    Close
                  </button>
                  {selAppt.status === "Pending" && (
                    <button
                      className="dd-btn accept"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => {
                        updateApptStatus(selAppt._id, "Accepted");
                        setSelAppt(null);
                      }}
                    >
                      ✓ Accept
                    </button>
                  )}
                  {selAppt.status === "Completed" && (
                    <button
                      className="dd-btn rx"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => {
                        openRxFor(selAppt);
                        setSelAppt(null);
                      }}
                    >
                      💊 Write Rx
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
{/*  SARA — CUTE CHIBI ROBOT  */}
<style>{`
  @keyframes sara-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-11px); }
  }
  @keyframes sara-pulse-ring {
    0%   { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes sara-blink {
    0%,90%,100% { transform: scaleY(1); }
    95%         { transform: scaleY(0.07); }
  }
  @keyframes sara-wave {
    0%,100% { transform: rotate(0deg); }
    30%     { transform: rotate(-22deg); }
    70%     { transform: rotate(16deg); }
  }
  @keyframes sara-glow {
    0%,100% { filter: drop-shadow(0 0 10px rgba(0,212,170,0.3)) drop-shadow(0 10px 28px rgba(0,0,0,0.45)); }
    50%     { filter: drop-shadow(0 0 26px rgba(0,212,170,0.65)) drop-shadow(0 10px 38px rgba(0,0,0,0.55)); }
  }
  @keyframes sara-glow-active {
    0%,100% { filter: drop-shadow(0 0 18px rgba(0,212,170,0.6)) drop-shadow(0 10px 32px rgba(0,0,0,0.5)); }
    50%     { filter: drop-shadow(0 0 40px rgba(0,212,170,1.0)) drop-shadow(0 10px 44px rgba(0,0,0,0.65)); }
  }
  @keyframes sara-bar {
    0%,100% { transform: scaleY(0.3); }
    50%     { transform: scaleY(1.6); }
  }
  @keyframes sara-bubble-in {
    from { opacity:0; transform: translateX(18px) scale(0.9); }
    to   { opacity:1; transform: translateX(0) scale(1); }
  }
  @keyframes sara-chest-pulse {
    0%,100% { opacity: 0.75; }
    50%     { opacity: 1; }
  }
  @keyframes sara-ant-glow {
    0%,100% { opacity: 0.78; }
    50%     { opacity: 1; }
  }
  @keyframes sara-platform-glow {
    0%,100% { opacity: 0.5; }
    50%     { opacity: 0.85; }
  }
  @keyframes sara-tooltip-bob {
    0%,100% { transform: translateY(0) translateX(-50%); }
    50%     { transform: translateY(-5px) translateX(-50%); }
  }
  @keyframes sara-eye-pulse {
    0%,100% { opacity: 0.7; }
    50%     { opacity: 1; }
  }

  .sara-wrap {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 14px;
    pointer-events: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sara-bubble {
    pointer-events: auto;
    animation: sara-bubble-in 0.42s cubic-bezier(.22,1,.36,1);
    background: linear-gradient(155deg, #061810 0%, #0a2e1c 100%);
    border: 1.5px solid rgba(201,168,76,0.45);
    border-radius: 20px 20px 4px 20px;
    padding: 14px 18px 16px;
    max-width: 218px;
    margin-bottom: 18px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04);
    position: relative;
  }
  .sara-bubble::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 40%;
    background: linear-gradient(rgba(255,255,255,0.04), transparent);
    border-radius: 20px 20px 0 0;
    pointer-events: none;
  }
  .sara-bubble-name {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 7px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .sara-bubble-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #c9a84c;
    box-shadow: 0 0 6px rgba(201,168,76,0.9);
  }
  .sara-bubble-text {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.6;
    color: rgba(255,255,255,0.88);
  }
  .sara-bubble-wave {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 11px;
    height: 22px;
  }
  .sara-bubble-wave span {
    display: block;
    width: 3px;
    border-radius: 3px;
    transform-origin: bottom;
  }
  .sara-robot-wrap {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }
  .sara-robot-svg {
    animation: sara-float 4s ease-in-out infinite, sara-glow 3s ease-in-out infinite;
  }
  .sara-robot-svg.active {
    animation: sara-float 4s ease-in-out infinite, sara-glow-active 2s ease-in-out infinite;
  }
  .sara-eye-l {
    transform-box: fill-box;
    transform-origin: center;
    animation: sara-blink 5s ease-in-out infinite;
  }
  .sara-eye-r {
    transform-box: fill-box;
    transform-origin: center;
    animation: sara-blink 5s 0.2s ease-in-out infinite;
  }
  .sara-arm-r {
    transform-box: fill-box;
    transform-origin: center top;
    animation: sara-wave 2.2s ease-in-out infinite;
  }
  .sara-chest  { animation: sara-chest-pulse   1.8s ease-in-out infinite; }
  .sara-antb   { animation: sara-ant-glow       1.6s ease-in-out infinite; }
  .sara-platg  { animation: sara-platform-glow  2.4s ease-in-out infinite; }
  .sara-eyegl  { animation: sara-eye-pulse      2s   ease-in-out infinite; }
  .sara-eyegr  { animation: sara-eye-pulse      2s   0.35s ease-in-out infinite; }

  .sara-ring-1 {
    position: absolute;
    width: 120px; height: 120px;
    border-radius: 50%;
    border: 1.5px solid rgba(0,212,170,0.55);
    top: 50%; left: 50%;
    margin-left: -60px; margin-top: -60px;
    animation: sara-pulse-ring 2.6s 0s ease-out infinite;
    pointer-events: none;
  }
  .sara-ring-2 {
    position: absolute;
    width: 120px; height: 120px;
    border-radius: 50%;
    border: 1px solid rgba(201,168,76,0.35);
    top: 50%; left: 50%;
    margin-left: -60px; margin-top: -60px;
    animation: sara-pulse-ring 2.6s 0.9s ease-out infinite;
    pointer-events: none;
  }
  .sara-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0a1f14, #133d22);
    border: 1px solid rgba(201,168,76,0.4);
    border-radius: 10px;
    padding: 5px 13px;
    font-size: 10.5px;
    font-weight: 700;
    color: rgba(201,168,76,0.9);
    white-space: nowrap;
    box-shadow: 0 6px 20px rgba(0,0,0,0.45);
    animation: sara-tooltip-bob 3s ease-in-out infinite;
    pointer-events: none;
  }
  .sara-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(201,168,76,0.6);
    margin-top: 5px;
    transition: color 0.3s;
  }
  .sara-label.active {
    color: rgba(201,168,76,0.9);
    text-shadow: 0 0 10px rgba(201,168,76,0.4);
  }
`}</style>

<div className="sara-wrap">

{/*  SPEECH BUBBLE + KEYBOARD FALLBACK */}
  {voiceActive && (
    <div className="sara-bubble">
      <div className="sara-bubble-name">
        <span className="sara-bubble-dot"/>
        Sara
        {/* Keyboard toggle — accessibility fallback */}
        <button
          aria-label="Type a command instead of speaking"
          title="Type a command"
          onClick={() => setSaraTextOpen(o => !o)}
          style={{
            marginLeft: "auto",
            background: saraTextOpen
              ? "rgba(201,168,76,0.25)"
              : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(201,168,76,0.35)",
            borderRadius: 6,
            color: "#c9a84c",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            fontFamily: "inherit",
            transition: "background .15s",
          }}
        >
          ⌨
        </button>
      </div>

      <div className="sara-bubble-text">
        {vaSpeaking
          ? "Speaking — interrupt anytime"
          : vaListening
          ? "I'm listening, Doctor…"
          : "Ready — awaiting your command"}
      </div>

      {/* Keyboard input — shown when ⌨ toggled or on iOS */}
      {(saraTextOpen || IS_IOS) && (
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          <input
            aria-label="Type a command for Sara"
            value={saraTextInput}
            onChange={e => setSaraTextInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && saraTextInput.trim()) {
                const cmd = saraTextInput.trim().slice(0, 200).toLowerCase();
                setSaraTextInput("");
                showToast(`⌨️ "${cmd}"`);
                handleVoiceCommandRef.current?.(cmd);
              }
            }}
            placeholder="Type a command…"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
              fontFamily: "inherit",
              padding: "6px 10px",
              outline: "none",
            }}
          />
          <button
            aria-label="Send typed command to Sara"
            onClick={() => {
              const cmd = saraTextInput.trim().toLowerCase();
              if (!cmd) return;
              setSaraTextInput("");
              showToast(`⌨️ "${cmd}"`);
              handleVoiceCommandRef.current?.(cmd);
            }}
            style={{
              background: "rgba(201,168,76,0.2)",
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: 8,
              color: "#c9a84c",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              padding: "4px 10px",
              fontFamily: "inherit",
            }}
          >
            ↵
          </button>
        </div>
      )}

      {(vaSpeaking || vaListening) && (
        <div className="sara-bubble-wave">
          {[0.5,0.9,1.3,0.7,1.5,0.6,1.2,0.8,1.4,0.5,1.0,0.7].map((h, i) => (
            <span key={i} style={{
              height: `${h * 14}px`,
              background: vaSpeaking ? "#a0f8e0" : "#c9a84c",
              animation: `sara-bar ${0.28 + i * 0.06}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.04}s`,
            }}/>
          ))}
        </div>
      )}
    </div>
  )}
 



  {/*  ROBOT */}
  <div
    className="sara-robot-wrap"
    onClick={voiceActive ? deactivateVoiceAssistant : activateVoiceAssistant}
  >
    {!voiceActive && <div className="sara-tooltip">Tap to activate Sara</div>}
    {voiceActive && <><div className="sara-ring-1"/><div className="sara-ring-2"/></>}

    <svg
      className={`sara-robot-svg${voiceActive ? " active" : ""}`}
      width="130" height="220"
      viewBox="0 0 120 210"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sr-wh" cx="28%" cy="22%" r="78%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="55%" stopColor="#e2eeea"/>
          <stop offset="100%" stopColor="#a8c8c0"/>
        </radialGradient>
        <radialGradient id="sr-wh2" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#cce3dc"/>
          <stop offset="100%" stopColor="#7aaaa0"/>
        </radialGradient>
        <radialGradient id="sr-vis" cx="50%" cy="22%" r="75%">
          <stop offset="0%" stopColor="#0e201a"/>
          <stop offset="100%" stopColor="#040d08"/>
        </radialGradient>
        <radialGradient id="sr-eye" cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor={vaListening ? "#fff0aa" : "#90ffee"}/>
          <stop offset="50%" stopColor={vaListening ? "#c9a84c" : "#00e5cc"}/>
          <stop offset="100%" stopColor={vaListening ? "#7a6028" : "#006e52"}/>
        </radialGradient>
        <radialGradient id="sr-orb" cx="38%" cy="32%" r="66%">
          <stop offset="0%" stopColor="#b8fff5"/>
          <stop offset="50%" stopColor="#00d4aa"/>
          <stop offset="100%" stopColor="#00523a"/>
        </radialGradient>
        <radialGradient id="sr-ant" cx="32%" cy="26%" r="68%">
          <stop offset="0%" stopColor="#b0ffd0"/>
          <stop offset="55%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#064e20"/>
        </radialGradient>
        <radialGradient id="sr-plat" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#0d3a22" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#040c08" stopOpacity="0.5"/>
        </radialGradient>
        <linearGradient id="sr-ring" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#15803d"/>
        </linearGradient>
        <filter id="sr-ef" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sr-pf" x="-40%" y="-80%" width="180%" height="360%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <filter id="sr-af" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sr-of" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* PLATFORM  */}
      <ellipse className="sara-platg" cx="60" cy="197" rx="46" ry="11" fill="#00d4aa" filter="url(#sr-pf)" opacity="0.6"/>
      <ellipse cx="60" cy="197" rx="50" ry="13" fill="url(#sr-plat)"/>
      <ellipse cx="60" cy="196" rx="49" ry="12" fill="none" stroke="#00d4aa" strokeWidth="2.2" opacity="0.9"/>
      <ellipse cx="60" cy="195" rx="43" ry="9.5" fill="none" stroke="rgba(0,212,170,0.38)" strokeWidth="1"/>
      <ellipse cx="50" cy="192" rx="20" ry="4.5" fill="rgba(255,255,255,0.09)"/>
      <ellipse cx="60" cy="192" rx="27" ry="5.5" fill="rgba(0,0,0,0.32)"/>

      {/* LEFT LEG  */}
      <rect x="35" y="163" width="21" height="24" rx="10" fill="url(#sr-wh)"/>
      <ellipse cx="44" cy="189" rx="18" ry="7.5" fill="url(#sr-wh2)"/>
      <ellipse cx="40" cy="187" rx="8" ry="3" fill="rgba(255,255,255,0.22)"/>

      {/* RIGHT LEG */}
      <rect x="64" y="163" width="21" height="24" rx="10" fill="url(#sr-wh)"/>
      <ellipse cx="76" cy="189" rx="18" ry="7.5" fill="url(#sr-wh2)"/>
      <ellipse cx="72" cy="187" rx="8" ry="3" fill="rgba(255,255,255,0.22)"/>

      {/*  LEFT ARM  */}
      <rect x="4" y="117" width="20" height="38" rx="10" fill="url(#sr-wh)"/>
      <rect x="4" y="128" width="20" height="10" rx="0" fill="url(#sr-ring)"/>
      <rect x="4" y="128" width="20" height="2" rx="0" fill="rgba(255,255,255,0.28)"/>
      <ellipse cx="14" cy="158" rx="10" ry="8" fill="url(#sr-wh2)"/>

      {/* RIGHT ARM */}
      <g className="sara-arm-r">
        <rect x="96" y="117" width="20" height="38" rx="10" fill="url(#sr-wh)"/>
        <rect x="96" y="128" width="20" height="10" rx="0" fill="url(#sr-ring)"/>
        <rect x="96" y="128" width="20" height="2" rx="0" fill="rgba(255,255,255,0.28)"/>
        <ellipse cx="106" cy="158" rx="10" ry="8" fill="url(#sr-wh2)"/>
      </g>

      {/* BODY */}
      <rect x="22" y="108" width="76" height="64" rx="28" fill="url(#sr-wh)"/>
      <ellipse cx="38" cy="120" rx="18" ry="11" fill="white" opacity="0.36"/>
      <ellipse cx="60" cy="165" rx="32" ry="10" fill="rgba(0,0,0,0.07)"/>

      {/*  SHOULDER CAPS */}
      <circle cx="22" cy="120" r="10" fill="url(#sr-wh2)"/>
      <circle cx="22" cy="117" r="5" fill="rgba(255,255,255,0.22)"/>
      <circle cx="98" cy="120" r="10" fill="url(#sr-wh2)"/>
      <circle cx="98" cy="117" r="5" fill="rgba(255,255,255,0.22)"/>

      {/*  CHEST ORB  */}
      <circle className="sara-chest" cx="60" cy="137" r="18" fill={vaListening ? "rgba(201,168,76,0.22)" : "rgba(0,212,170,0.22)"} filter="url(#sr-of)"/>
      <circle cx="60" cy="137" r="13" fill="url(#sr-orb)"/>
      <circle cx="55.5" cy="131.5" r="4.5" fill="white" opacity="0.66"/>
      <circle cx="66" cy="143" r="2.2" fill="rgba(255,255,255,0.3)"/>

      {/*  HEAD  */}
      <rect x="7" y="16" width="106" height="98" rx="44" fill="url(#sr-wh)"/>
      <ellipse cx="24" cy="28" rx="26" ry="16" fill="white" opacity="0.44"/>
      <ellipse cx="60" cy="110" rx="44" ry="8" fill="rgba(0,0,0,0.07)"/>

      {/*  VISOR  */}
      <rect x="15" y="28" width="90" height="72" rx="34" fill="url(#sr-vis)"/>
      <rect x="15" y="28" width="90" height="72" rx="34" fill="none" stroke="rgba(0,212,170,0.16)" strokeWidth="1.5"/>
      <rect x="21" y="30" width="78" height="24" rx="22" fill="rgba(255,255,255,0.05)"/>

      {/* EYES  */}
      <circle className="sara-eyegl" cx="38" cy="62" r="16" fill={vaListening ? "rgba(201,168,76,0.35)" : "rgba(0,212,170,0.3)"} filter="url(#sr-ef)"/>
      <circle className="sara-eyegr" cx="82" cy="62" r="16" fill={vaListening ? "rgba(201,168,76,0.35)" : "rgba(0,212,170,0.3)"} filter="url(#sr-ef)"/>
      <circle className="sara-eye-l" cx="38" cy="62" r="11" fill="url(#sr-eye)"/>
      <circle cx="38" cy="62" r="11" fill="none" stroke={vaListening ? "rgba(255,220,80,0.5)" : "rgba(0,255,210,0.45)"} strokeWidth="1.2"/>
      <circle cx="42.5" cy="56.5" r="4" fill="white" opacity="0.9"/>
      <circle cx="34" cy="67" r="2" fill="white" opacity="0.38"/>
      <circle className="sara-eye-r" cx="82" cy="62" r="11" fill="url(#sr-eye)"/>
      <circle cx="82" cy="62" r="11" fill="none" stroke={vaListening ? "rgba(255,220,80,0.5)" : "rgba(0,255,210,0.45)"} strokeWidth="1.2"/>
      <circle cx="86.5" cy="56.5" r="4" fill="white" opacity="0.9"/>
      <circle cx="78" cy="67" r="2" fill="white" opacity="0.38"/>

      {/* SMILE  */}
      <path
        d={vaSpeaking ? "M 34 83 Q 60 98 86 83" : vaListening ? "M 36 81 Q 60 93 84 81" : "M 40 80 Q 60 90 80 80"}
        stroke={vaListening ? "rgba(201,168,76,0.35)" : "rgba(0,255,210,0.3)"}
        strokeWidth="6" fill="none" strokeLinecap="round"
      />
      <path
        d={vaSpeaking ? "M 34 83 Q 60 98 86 83" : vaListening ? "M 36 81 Q 60 93 84 81" : "M 40 80 Q 60 90 80 80"}
        stroke={vaListening ? "#c9a84c" : "#00d4aa"}
        strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.9"
      />

      {/*  ANTENNA  */}
      <rect x="56" y="7" width="8" height="16" rx="4" fill="#cce0da"/>
      <rect x="58" y="7" width="4" height="10" rx="2" fill="rgba(255,255,255,0.38)"/>
      <circle className="sara-antb" cx="60" cy="5" r="12" fill="url(#sr-ant)" filter="url(#sr-af)" opacity="0.85"/>
      <circle cx="60" cy="5" r="8" fill="url(#sr-ant)"/>
      <circle cx="57" cy="2.5" r="3" fill="white" opacity="0.78"/>
    </svg>

    <div className={`sara-label${voiceActive ? " active" : ""}`}>
      {voiceActive
        ? vaSpeaking  ? "✦ speaking"
        : vaListening ? "✦ listening"
        :               "✦ sara"
        : "sara"}
    </div>
  </div>
</div>

{/* TOAST  */}
{toast && (
  <div className={`dd-toast${toast.type === "error" ? " err" : ""}`}>
    {toast.type === "error" ? "❌" : "✅"} {toast.msg}
  </div>
)}
    </>
  );
}
