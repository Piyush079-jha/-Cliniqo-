// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import ringtoneFile from "../assets/ringtone.mp3";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const SocketContext = createContext(null);

export function SocketProvider({ children, user, doctor }) {
  const socketRef    = useRef(null);
  const navigate     = useNavigate();
  const ringtoneRef  = useRef(null);
  const notifSoundRef = useRef(null);

  const [incomingCall, setIncomingCall] = useState(null);
  const [socketReady,  setSocketReady]  = useState(false);

  //  Unlock audio on first user interaction 
  useEffect(() => {
    const unlock = () => {
      // Init ringtone ref
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio(ringtoneFile);
        ringtoneRef.current.loop = true;
      }
      // Init notif sound ref
      if (!notifSoundRef.current) {
        notifSoundRef.current = new Audio(ringtoneFile);
        notifSoundRef.current.loop = false;
      }
      // Silent play-pause to unlock
      ringtoneRef.current.play().then(() => {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }).catch(() => {});
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio(ringtoneFile);
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(() => {});
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  //  Connect once per user 
  useEffect(() => {
    const userId = doctor?._id || user?._id;
    const role   = doctor?._id ? "doctor" : "patient";

    if (!userId) return;

    // Disconnect old socket if user changed
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    }

    const socket = io(BASE, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register", { userId, role });
      setSocketReady(true);
    });

    socket.on("disconnect", () => {
      setSocketReady(false);
    });

    // Already connected when VideoCall mounts after patient accepts
    if (socket.connected) {
      socket.emit("register", { userId, role });
      setSocketReady(true);
    }

    //  Patient: receive incoming call from any page 
socket.on("incoming-call", ({ consultationId, doctorName, roomId }) => {
  setIncomingCall({ consultationId, doctorName, roomId });
  playRingtone();
});

socket.on("call-missed",            () => stopRingtone());
socket.on("call-ended-notify", () => {
  stopRingtone();
  setIncomingCall(null);
});
socket.on("video-request-rejected", () => stopRingtone());
socket.on("new-video-request", () => {
  new Audio("/notification.mp3").play().catch(() => {});
});
    // Doctor: short notification sound when VC request accepted 
        return () => {
  stopRingtone();
  socket.off("call-missed");
  socket.off("call-ended-notify");
  socket.off("video-request-rejected");
socket.off("new-video-request");
  socket.disconnect();
  socketRef.current = null;
  setSocketReady(false);
};
  }, [user?._id, doctor?._id]);

  // Patient accepts call 
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    stopRingtone();

    try {
      const res  = await fetch(
        `${BASE}/api/v1/videoconsult/${incomingCall.consultationId}/patient-accept`,
        { method: "PUT", credentials: "include" }
      );
      const data = await res.json();

      if (data.success) {
        const roomId = data.roomId || incomingCall.roomId;

        // Notify doctor via the GLOBAL socket BEFORE navigating
        socketRef.current?.emit("patient-accept-call", {
          consultationId: incomingCall.consultationId,
          roomId,
          patientName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        });

        setIncomingCall(null);

        // Navigate — VideoCall will REUSE this same socket via useSocket()
        navigate(`/video/${roomId}`);
      }
    } catch (err) {
      console.error("[Socket] acceptCall error:", err);
    }
  }, [incomingCall, user, navigate]);

  //  Patient declines call
  const declineCall = useCallback(async () => {
    if (!incomingCall) return;
    stopRingtone();

    try {
      await fetch(
        `${BASE}/api/v1/videoconsult/${incomingCall.consultationId}/patient-decline`,
        { method: "PUT", credentials: "include" }
      );
      socketRef.current?.emit("patient-decline-call", {
        consultationId: incomingCall.consultationId,
        patientName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      });
    } catch (err) {
      console.error("[Socket] declineCall error:", err);
    }
    setIncomingCall(null);
  }, [incomingCall, user]);

  return (
    <SocketContext.Provider value={{
      socket:      socketRef.current,
      socketRef,
      socketReady,
      incomingCall,
      acceptCall,
      declineCall,
    }}>
      {children}

      {/*  Global incoming call overlay  renders on ANY page*/}
      {incomingCall && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(10,15,26,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(12px)",
        }}>
          <style>{`
            @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
            @keyframes pulse  { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
            @keyframes ring   { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-12deg)} 75%{transform:rotate(12deg)} }
          `}</style>
          <div style={{
            background: "linear-gradient(135deg,#0f1f2e,#1a3040)",
            border: "1.5px solid rgba(255,255,255,.12)",
            borderRadius: 24, padding: "40px 48px",
            textAlign: "center", maxWidth: 360, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,.5)",
            animation: "fadeUp .35s cubic-bezier(.22,1,.36,1)",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg,#1a5c3a,#2d6a4f)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, margin: "0 auto 16px",
              boxShadow: "0 0 0 8px rgba(26,92,58,.2), 0 0 0 16px rgba(26,92,58,.1)",
              animation: "pulse 2s infinite",
            }}>🩺</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>
              <span style={{ display: "inline-block", animation: "ring 1s ease-in-out infinite" }}>📞</span> Incoming Call
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
              {incomingCall.doctorName}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 32 }}>
              is calling you for a video consultation
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={declineCall} style={{
                padding: "13px 28px", borderRadius: 999, border: "none",
                background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(220,38,38,.4)",
                display: "flex", alignItems: "center", gap: 8, transition: "all .2s",
              }}>📵 Decline</button>
              <button onClick={acceptCall} style={{
                padding: "13px 28px", borderRadius: 999, border: "none",
                background: "linear-gradient(135deg,#059669,#047857)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(5,150,105,.4)",
                display: "flex", alignItems: "center", gap: 8, transition: "all .2s",
              }}>📹 Accept</button>
            </div>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);