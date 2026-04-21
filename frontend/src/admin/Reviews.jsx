import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const BASE = "http://localhost:5000";

// Give each reviewer a consistent avatar color based on their name
const COLORS = ["#1a5c3a","#c9a84c","#0ea5e9","#8b5cf6","#ef4444","#10b981","#f59e0b","#06b6d4"];
const getColor = name => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

// Star renderer — filled vs empty
const Stars = ({ rating }) => (
  <span style={{ color: "#f59e0b", fontSize: 14, letterSpacing: 1 }}>
    {"★".repeat(rating)}{"☆".repeat(5 - rating)}
  </span>
);

const Reviews = () => {
  const [reviews,  setReviews]  = useState([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filter,   setFilter]   = useState("All"); // All | 1★ | 2★ | 3★ | 4★ | 5★
  const { isAdminAuthenticated } = useContext(Context);

  // Load all reviews when admin lands on this page
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    axios.get(`${BASE}/api/v1/review/getall`, { withCredentials: true })
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  }, [isAdminAuthenticated]);

  if (!isAdminAuthenticated) return <Navigate to="/admin/login" />;

  // Admin deletes a review (spam, abuse, etc.)
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await axios.delete(`${BASE}/api/v1/review/admin/delete/${id}`, { withCredentials: true });
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success("Review deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    } finally {
      setDeleting(null);
    }
  };

  // Filter by search text and star rating
  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.patientName?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q);
    const matchFilter = filter === "All" || r.rating === parseInt(filter);
    return matchSearch && matchFilter;
  });

  // Quick stats for the top bar
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@1,700&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn   { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{left:-100%} 100%{left:200%} }

        .rv { padding:36px 40px; background:#f5f7f5; min-height:100vh; font-family:'Outfit',sans-serif; }

        /* ── Header ── */
        .rv-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; animation:fadeUp .4s ease both; }
        .rv-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:#0f1f15; letter-spacing:-.5px; }
        .rv-sub { font-size:13px; color:#6b8f7a; margin-top:5px; }
        .rv-stats { display:flex; gap:12px; flex-wrap:wrap; }
        .rv-stat-pill { background:linear-gradient(135deg,#0a1810,#1a5c3a); color:#c9a84c; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; box-shadow:0 4px 14px rgba(10,24,16,.2); }

        /* ── Toolbar ── */
        .rv-toolbar { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; align-items:center; animation:fadeUp .4s .05s ease both; }
        .rv-search-wrap { position:relative; flex:1; min-width:220px; max-width:360px; }
        .rv-search { width:100%; padding:10px 16px 10px 40px; border:1.5px solid #d4e8dc; border-radius:10px; font-size:13.5px; background:#fff; color:#0f1f15; outline:none; transition:all .2s; font-family:'Outfit',sans-serif; box-sizing:border-box; }
        .rv-search:focus { border-color:#1a5c3a; box-shadow:0 0 0 3px rgba(26,92,58,.1); }
        .rv-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); opacity:.4; font-size:14px; pointer-events:none; }

        /* Star filter tabs */
        .rv-filters { display:flex; gap:6px; flex-wrap:wrap; }
        .rv-ftab { padding:7px 14px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; border:1.5px solid #e4ede8; background:#fff; color:#6b8f7a; transition:all .18s; font-family:'Outfit',sans-serif; }
        .rv-ftab:hover { border-color:#1a5c3a; color:#1a5c3a; }
        .rv-ftab.on { background:#1a5c3a; color:#fff; border-color:#1a5c3a; }
        .rv-results { font-size:13px; color:#6b8f7a; font-weight:500; margin-left:auto; }

        /* ── Table card ── */
        .rv-wrap { background:#fff; border-radius:16px; border:1px solid #e4ede8; overflow:hidden; box-shadow:0 1px 4px rgba(15,35,24,.05); animation:fadeUp .4s .1s ease both; }
        .rv-table { width:100%; border-collapse:collapse; }
        .rv-table thead th { padding:13px 20px; text-align:left; font-size:10.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#a8c4b4; background:#f7fbf8; border-bottom:1px solid #e4ede8; }
        .rv-table tbody tr { border-bottom:1px solid #f0f5f2; transition:background .15s; animation:rowIn .3s ease both; }
        .rv-table tbody tr:last-child { border-bottom:none; }
        .rv-table tbody tr:hover { background:#f7fbf8; }
        .rv-table td { padding:14px 20px; font-size:13.5px; color:#0f1f15; vertical-align:middle; }

        /* Patient cell */
        .rv-patient { display:flex; align-items:center; gap:11px; }
        .rv-av { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#fff; flex-shrink:0; }
        .rv-patient-name { font-weight:700; font-size:13.5px; color:#0f1f15; }
        .rv-patient-type { font-size:11px; color:#6b8f7a; margin-top:2px; }

        /* Comment cell */
        .rv-comment { font-size:13px; color:#3a5446; line-height:1.55; max-width:320px; }

        /* Date */
        .rv-date { font-size:12px; color:#6b8f7a; white-space:nowrap; }

        /* Delete button */
        .rv-del { padding:6px 13px; border-radius:8px; background:#fef2f2; color:#ef4444; border:1px solid #fecaca; font-size:12px; font-weight:700; cursor:pointer; transition:all .2s; font-family:'Outfit',sans-serif; white-space:nowrap; }
        .rv-del:hover:not(:disabled) { background:#ef4444; color:#fff; border-color:#ef4444; transform:translateY(-1px); box-shadow:0 4px 12px rgba(239,68,68,.25); }
        .rv-del:disabled { opacity:.4; cursor:not-allowed; }

        /* Empty / loading */
        .rv-empty { text-align:center; padding:60px; color:#a8c4b4; }
        .rv-empty-icon { font-size:44px; margin-bottom:12px; opacity:.35; }

        @media(max-width:900px){
          .rv { padding:20px 16px; }
          .rv-table thead { display:none; }
          .rv-table tr { display:block; margin-bottom:12px; border:1px solid #e4ede8; border-radius:12px; }
          .rv-table td { display:flex; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f0f5f2; }
          .rv-table td:last-child { border-bottom:none; }
        }
      `}</style>

      <div className="rv">

        {/* Header */}
        <div className="rv-head">
          <div>
            <div className="rv-title">Patient Reviews</div>
            <div className="rv-sub">Monitor and moderate what patients are saying — remove spam or abuse</div>
          </div>
          <div className="rv-stats">
            <div className="rv-stat-pill">⭐ {avgRating} Avg Rating</div>
            <div className="rv-stat-pill">💬 {reviews.length} Total Reviews</div>
          </div>
        </div>

        {/* Toolbar — search + star filter */}
        <div className="rv-toolbar">
          <div className="rv-search-wrap">
            <span className="rv-search-icon">🔍</span>
            <input
              className="rv-search"
              placeholder="Search by patient name or comment…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="rv-filters">
            {["All", "5", "4", "3", "2", "1"].map(f => (
              <button
                key={f}
                className={`rv-ftab ${filter === f ? "on" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "All" ? "All Stars" : `${f}★`}
              </button>
            ))}
          </div>
          <span className="rv-results">Showing {filtered.length} of {reviews.length}</span>
        </div>

        {/* Table */}
        <div className="rv-wrap">
          {loading ? (
            <div className="rv-empty"><div className="rv-empty-icon">⏳</div>Loading reviews…</div>
          ) : filtered.length === 0 ? (
            <div className="rv-empty"><div className="rv-empty-icon">💬</div>No reviews found</div>
          ) : (
            <table className="rv-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r._id} style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s` }}>

                    {/* Patient */}
                    <td>
                      <div className="rv-patient">
                        <div className="rv-av" style={{ background: getColor(r.patientName) }}>
                          {r.patientName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="rv-patient-name">{r.patientName || "Anonymous"}</div>
                          {/* General review = no doctor, otherwise shows doctor review */}
                          <div className="rv-patient-type">{r.doctorId ? "Doctor Review" : "General Review"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Stars */}
                    <td><Stars rating={r.rating} /></td>

                    {/* Comment — truncated, full on hover via title */}
                    <td>
                      <div className="rv-comment" title={r.comment}>
                        {r.comment?.length > 100 ? r.comment.slice(0, 100) + "…" : r.comment}
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <div className="rv-date">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </div>
                    </td>

                    {/* Delete — for spam / abuse control */}
                    <td>
                      <button
                        className="rv-del"
                        onClick={() => handleDelete(r._id)}
                        disabled={deleting === r._id}
                        title="Remove this review"
                      >
                        {deleting === r._id ? "Deleting…" : "🗑 Delete"}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </>
  );
};

export default Reviews;