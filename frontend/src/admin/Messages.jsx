import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const BASE = "http://localhost:5000";
const COLORS = ["#1a5c3a","#c9a84c","#0ea5e9","#8b5cf6","#ef4444","#10b981","#f59e0b","#06b6d4"];
const getColor = name => COLORS[(name?.charCodeAt(0)||0) % COLORS.length];
const initials  = m => `${m.firstName?.[0]||""}${m.lastName?.[0]||""}`.toUpperCase();

const Messages = () => {
  const [messages,  setMessages]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(null);
  const [selected,  setSelected]  = useState(null);
  const { isAdminAuthenticated } = useContext(Context);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    axios.get(`${BASE}/api/v1/message/getall`, { withCredentials:true })
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false));
  }, [isAdminAuthenticated]);

  if (!isAdminAuthenticated) return <Navigate to="/admin/login" />;

  const handleDelete = async id => {
    if (!window.confirm("Delete this message?")) return;
    setDeleting(id);
    try {
      await axios.delete(`${BASE}/api/v1/message/delete/${id}`, { withCredentials:true });
      setMessages(prev => prev.filter(m => m._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success("Message deleted");
    } catch { toast.error("Failed to delete message"); }
    finally { setDeleting(null); }
  };

  const filtered = messages.filter(m => {
    const q = search.toLowerCase();
    return !q || `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q);
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@1,700&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes panelIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{left:-100%} 100%{left:200%} }

        .mp { padding:36px 40px; background:#f5f7f5; min-height:100vh; font-family:'Outfit',sans-serif; }
        .mp-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; animation:fadeUp .4s ease both; }
        .mp-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:#0f1f15; letter-spacing:-.5px; }
        .mp-sub { font-size:13px; color:#6b8f7a; margin-top:5px; }
        .mp-count { background:linear-gradient(135deg,#0a1810,#1a5c3a); color:#c9a84c; padding:10px 22px; border-radius:12px; font-size:13px; font-weight:700; box-shadow:0 4px 14px rgba(10,24,16,.2); }

        .mp-layout { display:grid; grid-template-columns:1fr 420px; gap:20px; animation:fadeUp .4s .06s ease both; }
        .mp-layout.no-panel { grid-template-columns:1fr; }

        .mp-search-wrap { position:relative; margin-bottom:16px; }
        .mp-search { width:100%; padding:10px 16px 10px 40px; border:1.5px solid #d4e8dc; border-radius:10px; font-size:13.5px; background:#fff; color:#0f1f15; outline:none; transition:all .2s; font-family:'Outfit',sans-serif; }
        .mp-search:focus { border-color:#1a5c3a; box-shadow:0 0 0 3px rgba(26,92,58,.1); transform:translateY(-1px); }
        .mp-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); opacity:.4; font-size:14px; pointer-events:none; }

        .mp-list { display:flex; flex-direction:column; gap:8px; }
        .mp-item {
          background:#fff; border-radius:14px; border:1.5px solid #e4ede8; overflow:hidden;
          box-shadow:0 1px 4px rgba(15,35,24,.05); transition:all .22s cubic-bezier(.22,1,.36,1);
          cursor:pointer; animation:slideIn .3s ease both; position:relative;
        }
        .mp-item::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); pointer-events:none;
        }
        .mp-item:hover { box-shadow:0 8px 24px rgba(15,35,24,.1); transform:translateY(-2px); border-color:#d4e8dc; }
        .mp-item:hover::after { animation:shimmer .55s ease; }
        .mp-item.active { border-color:#1a5c3a; box-shadow:0 6px 20px rgba(26,92,58,.15); }

        .mp-item-top { display:flex; align-items:center; gap:13px; padding:15px 18px; }
        .mp-av {
          width:42px; height:42px; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          font-size:15px; font-weight:800; color:#fff; flex-shrink:0;
          transition: transform .25s cubic-bezier(.22,1,.36,1);
        }
        .mp-item:hover .mp-av { transform:scale(1.1) rotate(-4deg); }
        .mp-sender-name { font-size:14px; font-weight:700; color:#0f1f15; }
        .mp-sender-email { font-size:11px; color:#6b8f7a; margin-top:2px; }
        .mp-item-preview { padding:0 18px 14px; font-size:12.5px; color:#6b8f7a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .mp-del-btn {
          padding:5px 11px; border-radius:7px; background:#fef2f2; color:#ef4444; border:1px solid #fecaca;
          font-size:11px; font-weight:600; cursor:pointer; transition:all .2s; font-family:'Outfit',sans-serif; flex-shrink:0;
        }
        .mp-del-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; transform:scale(1.05); }
        .mp-del-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }

        .mp-detail {
          background:#fff; border-radius:16px; border:1px solid #e4ede8; overflow:hidden;
          box-shadow:0 1px 4px rgba(15,35,24,.05); height:fit-content; position:sticky; top:24px;
          animation:panelIn .35s ease both;
        }
        .mp-detail-head { padding:20px 22px; border-bottom:1px solid #f0f5f2; display:flex; align-items:center; justify-content:space-between; }
        .mp-detail-title { font-size:14px; font-weight:700; color:#0f1f15; }
        .mp-close-btn { width:28px; height:28px; border-radius:8px; background:#f0f5f2; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; color:#6b8f7a; transition:all .2s; }
        .mp-close-btn:hover { background:#e4ede8; color:#0f1f15; transform:rotate(90deg); }
        .mp-detail-body { padding:22px; }
        .mp-detail-av { width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; color:#fff; margin-bottom:14px; transition: transform .3s; }
        .mp-detail-av:hover { transform:scale(1.08) rotate(-3deg); }
        .mp-detail-name { font-size:18px; font-weight:800; color:#0f1f15; margin-bottom:4px; }
        .mp-detail-info { display:flex; flex-direction:column; gap:7px; margin-bottom:18px; }
        .mp-detail-row { display:flex; align-items:center; gap:8px; font-size:13px; color:#6b8f7a; }
        .mp-detail-row-icon { width:26px; height:26px; border-radius:7px; background:#f0f5f2; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
        .mp-detail-sep { height:1px; background:#f0f5f2; margin:16px 0; }
        .mp-detail-msg-label { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#a8c4b4; margin-bottom:10px; }
        .mp-detail-msg { background:#f7fbf8; border-radius:12px; padding:16px; font-size:14px; color:#0f2d1a; line-height:1.8; border-left:3px solid #1a5c3a; }
        .mp-detail-delete { width:100%; margin-top:18px; padding:10px; background:#fef2f2; color:#ef4444; border:1.5px solid #fecaca; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; transition:all .2s; }
        .mp-detail-delete:hover { background:#ef4444; color:#fff; border-color:#ef4444; transform:translateY(-1px); box-shadow:0 4px 14px rgba(239,68,68,.3); }

        .mp-placeholder { background:#fff; border-radius:16px; border:1px solid #e4ede8; padding:60px 30px; text-align:center; color:#a8c4b4; position:sticky; top:24px; }
        .mp-ph-icon { font-size:44px; margin-bottom:12px; opacity:.35; }
        .mp-empty { text-align:center; padding:60px; color:#a8c4b4; }
        .mp-empty-icon { font-size:44px; margin-bottom:12px; opacity:.35; }

        @media(max-width:1024px){ .mp-layout{grid-template-columns:1fr;} .mp-detail{position:static;} }
        @media(max-width:640px){ .mp{padding:20px 16px;} }
      `}</style>

      <div className="mp">
        <div className="mp-head">
          <div><div className="mp-title">Messages</div><div className="mp-sub">Patient inquiries and contact submissions</div></div>
          <div className="mp-count">💬 {messages.length} Total</div>
        </div>
        <div className="mp-search-wrap">
          <span className="mp-search-icon">🔍</span>
          <input className="mp-search" placeholder="Search by name, email or message content…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {loading ? (
          <div className="mp-empty"><div className="mp-empty-icon">⏳</div>Loading messages…</div>
        ) : filtered.length === 0 ? (
          <div className="mp-empty"><div className="mp-empty-icon">💬</div>No messages found</div>
        ) : (
          <div className={`mp-layout ${!selected?"no-panel":""}`}>
            <div className="mp-list">
              {filtered.map((msg,i) => (
                <div key={msg._id} className={`mp-item ${selected?._id===msg._id?"active":""}`} style={{animationDelay:`${Math.min(i*.04,.5)}s`}} onClick={()=>setSelected(selected?._id===msg._id?null:msg)}>
                  <div className="mp-item-top">
                    <div className="mp-av" style={{background:getColor(msg.firstName)}}>{initials(msg)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="mp-sender-name">{msg.firstName} {msg.lastName}</div>
                      <div className="mp-sender-email">{msg.email}</div>
                    </div>
                    <div onClick={e=>e.stopPropagation()}>
                      <button className="mp-del-btn" onClick={()=>handleDelete(msg._id)} disabled={deleting===msg._id}>{deleting===msg._id?"…":"🗑"}</button>
                    </div>
                  </div>
                  <div className="mp-item-preview">{msg.message}</div>
                </div>
              ))}
            </div>
            {selected ? (
              <div className="mp-detail">
                <div className="mp-detail-head">
                  <div className="mp-detail-title">Message Details</div>
                  <button className="mp-close-btn" onClick={()=>setSelected(null)}>✕</button>
                </div>
                <div className="mp-detail-body">
                  <div className="mp-detail-av" style={{background:getColor(selected.firstName)}}>{initials(selected)}</div>
                  <div className="mp-detail-name">{selected.firstName} {selected.lastName}</div>
                  <div className="mp-detail-info">
                    <div className="mp-detail-row"><div className="mp-detail-row-icon">✉</div>{selected.email}</div>
                    <div className="mp-detail-row"><div className="mp-detail-row-icon">📞</div>{selected.phone}</div>
                  </div>
                  <div className="mp-detail-sep"/>
                  <div className="mp-detail-msg-label">Message</div>
                  <div className="mp-detail-msg">{selected.message}</div>
                  <button className="mp-detail-delete" onClick={()=>handleDelete(selected._id)} disabled={deleting===selected._id}>
                    {deleting===selected._id?"Deleting…":"🗑 Delete Message"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mp-placeholder"><div className="mp-ph-icon">💬</div><p style={{fontSize:14,fontWeight:600}}>Click a message to view details</p></div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Messages;