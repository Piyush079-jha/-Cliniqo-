import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Context } from "../main";
import { useSocket } from "../context/SocketContext";
import ringtoneFile from "../assets/ringtone.mp3";
const BASE = import.meta.env.VITE_BACKEND_URL || "https://cliniqo-backend.onrender.com";

// ─────────────────────────────────────────────────────────────────────────────
// ICE servers for WebRTC — helps punch through firewalls
// ─────────────────────────────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "640c9737c145bee041ff65d0",
      credential: "Ro1eLEcjm1w1jmnW",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "640c9737c145bee041ff65d0",
      credential: "Ro1eLEcjm1w1jmnW",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "640c9737c145bee041ff65d0",
      credential: "Ro1eLEcjm1w1jmnW",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "640c9737c145bee041ff65d0",
      credential: "Ro1eLEcjm1w1jmnW",
    },
  ],
  iceCandidatePoolSize: 10,
};

// ─────────────────────────────────────────────────────────────────────────────
// All possible states a call can be in — like a lifecycle map
// ─────────────────────────────────────────────────────────────────────────────
const CALL_STATE = {
  IDLE:       "idle",
  CONNECTING: "connecting",
  RINGING:    "ringing",
  ACTIVE:     "active",
  ENDED:      "ended",
  DECLINED:   "declined",
  MISSED:     "missed",
  ERROR:      "error",
};

// ─────────────────────────────────────────────────────────────────────────────
// Allowed file types and max size (5 MB)
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; 
// ─────────────────────────────────────────────────────────────────────────────
// SVG icons — clean vector icons instead of emoji for a professional look
// ─────────────────────────────────────────────────────────────────────────────
const MicOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const CamOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const CamOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8"/>
  </svg>
);

const EndCallIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ── NEW: Paperclip / attach icon for file upload ──────────────────────────
const AttachIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

// ── NEW: Download icon for file messages ─────────────────────────────────
const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

// ── NEW: X icon for removing file preview ────────────────────────────────
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main VideoCall component
// Works for BOTH doctor and patient — role is passed as prop or auto-detected
// ─────────────────────────────────────────────────────────────────────────────
export default function VideoCall({ role: propRole, userName: propUserName, onEnd }) {
  const { appointmentId: roomId } = useParams();
  const navigate = useNavigate();
  const { user, doctor } = useContext(Context);

  // Figure out who is using this screen — doctor or patient
  const role = propRole || (doctor?._id ? "Doctor" : "Patient");
  const userName = propUserName || (
    doctor?._id
      ? `Dr. ${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim()
      : `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
  );

  // ── Global socket from SocketContext (shared, not a new connection) ────────
  const { socketRef, socketReady } = useSocket();
  const joinedRef = useRef(false); // prevents joining the same room twice

  // ── Video element refs ────────────────────────────────────────────────────
  const localVideoRef  = useRef(null); // your own camera (small PiP)
  const remoteVideoRef = useRef(null); // the other person's camera (main screen)

  // ── WebRTC refs ───────────────────────────────────────────────────────────
  const pcRef            = useRef(null); // RTCPeerConnection instance
  const localStream      = useRef(null); // your local camera/mic stream
  const iceCandidateBuf  = useRef([]);   // buffer ICE candidates before remote desc is set
  const remoteAudioRef   = useRef(null); // separate audio element for remote audio

  // ── Timer and chat refs ───────────────────────────────────────────────────
  const timerRef   = useRef(null);  // call duration interval
  const chatEndRef = useRef(null);  // auto-scroll chat to bottom

  // ── NEW: File upload refs ─────────────────────────────────────────────────
  const fileInputRef = useRef(null); // hidden <input type="file">
const ringtoneRef = useRef(null);
  // ── UI state ──────────────────────────────────────────────────────────────
  
  const [callState,       setCallState]       = useState(CALL_STATE.IDLE);
  const [statusMsg,       setStatusMsg]       = useState("Initializing…");
  const [connected,       setConnected]       = useState(false);
  const [micOn,           setMicOn]           = useState(true);
  const [camOn,           setCamOn]           = useState(true);
  const [messages,        setMessages]        = useState([]);
  const [chatInput,       setChatInput]       = useState("");
  const [showChat,        setShowChat]        = useState(false);
  const [remoteName,      setRemoteName]      = useState("");
  const [callDuration,    setCallDuration]    = useState(0);
  const [callDurationFmt, setCallDurationFmt] = useState("00:00");
  const [endedBy,         setEndedBy]         = useState(null);
  const [unreadCount,     setUnreadCount]     = useState(0); // badge for unread messages

  // ── NEW: Media upload state ───────────────────────────────────────────────
  const [pendingFile,     setPendingFile]     = useState(null);  // { file, previewUrl, type }
  const [uploadProgress,  setUploadProgress]  = useState(0);     // 0–100
  const [isUploading,     setIsUploading]     = useState(false);
  const [fileError,       setFileError]       = useState("");

  // Format seconds into MM:SS for the call timer display
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
useEffect(() => {
  const audio = new Audio(ringtoneFile);
  audio.loop = true;
  ringtoneRef.current = audio;
  return () => { audio.pause(); };
}, []);
useEffect(() => {
  const unlock = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().then(() => {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }).catch(() => {});
    }
    window.removeEventListener("click", unlock);
  };
  window.addEventListener("click", unlock);
  return () => window.removeEventListener("click", unlock);
}, []);
  // ─────────────────────────────────────────────────────────────────────────
  // Create a fresh WebRTC peer connection
  // We close any existing one first to avoid duplicate connections
  // ─────────────────────────────────────────────────────────────────────────
  const createPC = useCallback((remoteSocketId) => {
    if (pcRef.current) pcRef.current.close();

    const pc = new RTCPeerConnection({
      ...ICE_SERVERS,
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });
    pcRef.current = pc;

    // Add our local tracks (audio/video) to the connection
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    // When remote video arrives — attach it to the big screen
    pc.ontrack = (e) => {
      console.log("[WebRTC] ontrack fired", e.streams, e.track);
      const stream = e.streams?.[0] || new MediaStream([e.track]);
      
      if (e.track.kind === "video") {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
      }
      
      if (e.track.kind === "audio") {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }

      setConnected(true);
      setCallState(CALL_STATE.ACTIVE);
      setStatusMsg("Connected");
    };

    // Send ICE candidates to the other person through the socket
    pc.onicecandidate = (e) => {
      if (e.candidate && remoteSocketId) {
        socketRef.current?.emit("ice-candidate", { to: remoteSocketId, candidate: e.candidate });
      }
    };

    // React to connection state changes — connected, failed, closed
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] Connection state: ${state}`);
    };
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setConnected(true);
        setCallState(CALL_STATE.ACTIVE);
        setStatusMsg("Connected");
        ringtoneRef.current?.pause();
        if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
      }
    };
    pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC] ICE gathering: ${pc.iceGatheringState}`);
    };
    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC] Signaling state: ${pc.signalingState}`);
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] Connection state: ${state}`);

     if (state === "connected" || state === "completed") {
  setConnected(true);
  setCallState(CALL_STATE.ACTIVE);
  setStatusMsg("Connected");
  ringtoneRef.current?.pause();
  if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
        // Start counting call duration every second
        timerRef.current = setInterval(() => {
          setCallDuration(d => {
            setCallDurationFmt(fmt(d + 1));
            return d + 1;
          });
        }, 1000);
      } else if (["disconnected", "failed"].includes(state)) {
        setConnected(false);
        setStatusMsg("Connection lost — attempting to reconnect…");
      } else if (state === "closed") {
        setConnected(false);
        setCallState(CALL_STATE.ENDED);
        clearInterval(timerRef.current);
      }
    };

    return pc;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Ask the browser for camera and microphone access
  // Falls back to audio-only if camera is blocked
  // ─────────────────────────────────────────────────────────────────────────
  const getLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      console.log("[Media] Got video+audio tracks:", stream.getTracks().map(t => t.kind));
      return stream;
    } catch (videoErr) {
      console.warn("[Media] Video failed, trying audio only:", videoErr.message);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStream.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setStatusMsg("Camera unavailable — audio only");
        console.log("[Media] Got audio only");
        return stream;
      } catch (err) {
        console.error("[Media] All media failed:", err.message);
        setStatusMsg(`Media error: ${err.message}`);
        setCallState(CALL_STATE.ERROR);
        return null;
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main effect — runs once when roomId and socket are ready
  // Sets up all socket listeners and starts the call
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !socketReady || !socketRef.current) return;
    if (joinedRef.current) return; // already joined — don't do it again
    joinedRef.current = true;

    let isMounted = true;
    const socket  = socketRef.current;
    const userId  = doctor?._id || user?._id;

    const initCall = async () => {
      setCallState(CALL_STATE.CONNECTING);
      setStatusMsg("Setting up camera & mic…");

      await getLocalMedia();
      if (!isMounted) return;

      setStatusMsg("Joining room…");
      socket.emit("join-room", { roomId, userId, userName, role });

      // If someone is already in the room — we send them an offer
   socket.on("room-participants", async (participants) => {
  if (!isMounted || participants.length === 0) return;
  const peer = participants[0];
  setRemoteName(peer.userName);
  setStatusMsg(`${peer.userName} is already here — connecting…`);
  ringtoneRef.current?.play().catch(() => {});

  // Only Doctor initiates offer — patient waits
  if (role !== "Doctor") {
    console.log("[WebRTC] Patient waiting for Doctor's offer...");
    return;
  }

  const pc = createPC(peer.socketId);
  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });
  await pc.setLocalDescription(offer);
  socket.emit("offer", { to: peer.socketId, offer });
  console.log(`[WebRTC] Doctor sent offer to ${peer.socketId}`);
});

      // When a new person joins after us — we send them an offer
      socket.on("user-joined", async ({ socketId, userName: uName, role: uRole }) => {
        if (!isMounted) return;
        setRemoteName(uName);
        setStatusMsg(`${uName} joined — connecting…`);
        ringtoneRef.current?.play().catch(() => {});

        // Only the DOCTOR sends the offer — patient waits for it
        // This prevents both sides sending offers simultaneously
        if (role !== "Doctor") return;

        const pc = createPC(socketId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        socket.emit("offer", { to: socketId, offer });
        console.log(`[WebRTC] Doctor sent offer to new joiner ${socketId}`);
      });

      // We received an offer — always process it, close old PC if needed
      socket.on("offer", async ({ from, offer }) => {
        if (!isMounted) return;
        try {
          iceCandidateBuf.current = [];
          const pc = createPC(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { to: from, answer });
          for (const c of iceCandidateBuf.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          iceCandidateBuf.current = [];
          console.log(`[WebRTC] Sent answer to ${from}`);
        } catch (err) {
          console.error("[WebRTC] offer handling error:", err);
        }
      });

      socket.on("answer", async ({ answer }) => {
        if (!pcRef.current) return;
        if (pcRef.current.signalingState !== "have-local-offer") {
          console.warn("[WebRTC] Ignoring answer in state:", pcRef.current.signalingState);
          return;
        }
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          for (const c of iceCandidateBuf.current) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          iceCandidateBuf.current = [];
        } catch (err) {
          console.error("[WebRTC] setRemoteDescription answer error:", err);
        }
      });

      // ICE candidate received — buffer if remote description not set yet
      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          if (pcRef.current?.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            iceCandidateBuf.current.push(candidate);
          }
        } catch {}
      });

      // The other person clicked end call
      socket.on("call-ended", ({ endedBy: by, message }) => {
  if (!isMounted) return;
  ringtoneRef.current?.pause();
  if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
  setCallState(CALL_STATE.ENDED);
  setStatusMsg(message || "The call has ended");
  setEndedBy(by);
  setConnected(false);
  clearInterval(timerRef.current);
  cleanup(false);
});

socket.on("call-ended-notify", ({ endedBy: by }) => {
  if (!isMounted) return;
  ringtoneRef.current?.pause();
  if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
  setCallState(CALL_STATE.ENDED);
  setStatusMsg("The call has ended");
  setEndedBy(by);
  setConnected(false);
  clearInterval(timerRef.current);
  cleanup(false);
});

      // Other person's network dropped
      socket.on("user-left", () => {
        if (!isMounted) return;
        setConnected(false);
        setStatusMsg("Other participant disconnected");
      });

      // Doctor gets notified when patient accepts the incoming call
      socket.on("patient-accepted-call", ({ patientName }) => {
        if (!isMounted) return;
        setRemoteName(patientName);
        setStatusMsg(`${patientName} is joining…`);
      });

      // Patient declined — show message to doctor
      socket.on("call-declined", ({ patientName, message }) => {
        if (!isMounted) return;
        setCallState(CALL_STATE.DECLINED);
        setStatusMsg(message || `${patientName} declined the call`);
        clearInterval(timerRef.current);
      });

      // Patient didn't answer in time — auto missed
      socket.on("call-missed", ({ patientName, message }) => {
        if (!isMounted) return;
        setCallState(CALL_STATE.MISSED);
        setStatusMsg(message || `${patientName} didn't answer`);
        clearInterval(timerRef.current);
      });

      // Text message received from the other person
      socket.on("chat-message", ({ message, senderName, senderId, timestamp }) => {
        if (!isMounted) return;
        setMessages(m => [...m, { type: "text", message, senderName, senderId, timestamp, mine: false }]);
        setUnreadCount(c => c + 1);
      });

      // Confirmation that our own text message was sent
      socket.on("chat-message-sent", ({ message, senderName, timestamp }) => {
        if (!isMounted) return;
        setMessages(m => [...m, { type: "text", message, senderName, timestamp, mine: true }]);
      });

      // ── NEW: File/media message received from the other person ───────────
      socket.on("chat-file", ({ fileUrl, fileName, fileType, senderName, senderId, timestamp }) => {
        if (!isMounted) return;
        setMessages(m => [...m, {
          type: "file", fileUrl, fileName, fileType,
          senderName, senderId, timestamp, mine: false,
        }]);
        setUnreadCount(c => c + 1);
      });

      // ── NEW: Confirmation that our own file message was delivered ─────────
      socket.on("chat-file-sent", ({ fileUrl, fileName, fileType, senderName, timestamp }) => {
        if (!isMounted) return;
        setMessages(m => [...m, {
          type: "file", fileUrl, fileName, fileType,
          senderName, timestamp, mine: true,
        }]);
      });
    };

    initCall();

    // Cleanup when component unmounts — remove all listeners
    return () => {
      isMounted = false;
      socket.off("room-participants");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("call-missed");
      socket.off("call-ended-notify");
      socket.off("user-left");
      socket.off("patient-accepted-call");
      socket.off("call-declined");
      socket.off("call-missed");
      socket.off("chat-message");
      socket.off("chat-message-sent");
      socket.off("chat-file");       // ← NEW
      socket.off("chat-file-sent");  // ← NEW
      localStream.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      clearInterval(timerRef.current);
      joinedRef.current = false;
    };
  }, [roomId, socketReady]);

  // Auto-scroll chat to bottom every time a new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset unread count when user opens the chat panel
  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup — stop tracks, close peer connection, update DB
  // ─────────────────────────────────────────────────────────────────────────
  const cleanup = (emit = true) => {
    if (emit && socketRef.current) {
      socketRef.current.emit("end-call", { roomId, endedBy: userName });
      // Tell the backend to mark this consultation as Ended in the database
      fetch(`${BASE}/api/v1/videoconsult/end-by-room/${roomId}`, {
        method: "PUT", credentials: "include"
      }).catch(() => {});
    }
    localStream.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    clearInterval(timerRef.current);
  };

  // User clicked the red end call button
  const endCall = () => {
  ringtoneRef.current?.pause();
  if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
  cleanup(true);
  setCallState(CALL_STATE.ENDED);
  setConnected(false);
  clearInterval(timerRef.current);
};
  // Send a text chat message to the other person
  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    const userId = doctor?._id || user?._id;
    socketRef.current.emit("chat-message", {
      roomId,
      message:    chatInput.trim(),
      senderName: userName,
      senderId:   userId,
    });
    setChatInput("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Handle file selection — validate then show preview
  // ─────────────────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!e.target.files?.length) return;

    // Reset input so same file can be selected again
    e.target.value = "";
    setFileError("");

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Only images, PDFs, Word docs, and text files are allowed.");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File too large — max 5 MB allowed.");
      return;
    }

    // Build preview URL for images
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    setPendingFile({ file, previewUrl, type: file.type, name: file.name });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Upload file to backend (Multer → Cloudinary) then emit via socket
  // ─────────────────────────────────────────────────────────────────────────
  const sendFile = async () => {
    if (!pendingFile || isUploading || !socketRef.current) return;

    setIsUploading(true);
    setUploadProgress(0);
    setFileError("");

    try {
      const formData = new FormData();
      formData.append("file", pendingFile.file);
      formData.append("roomId", roomId);

      // Use XHR so we can track upload progress
      const fileUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.fileUrl);
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));

        xhr.open("POST", `${BASE}/api/v1/videoconsult/upload-file`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      // Emit file message via socket
      const userId = doctor?._id || user?._id;
      socketRef.current.emit("chat-file", {
        roomId,
        fileUrl,
        fileName:   pendingFile.name,
        fileType:   pendingFile.type,
        senderName: userName,
        senderId:   userId,
      });

      // Clean up preview
      if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      setPendingFile(null);
      setUploadProgress(0);

    } catch (err) {
      setFileError("Upload failed — please try again.");
      console.error("[Upload] Error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel the pending file preview without sending
  const cancelFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    setFileError("");
    setUploadProgress(0);
  };

  // Toggle microphone on/off without stopping the stream
  const toggleMic = () => {
    const audio = localStream.current?.getAudioTracks()[0];
    if (audio) { audio.enabled = !audio.enabled; setMicOn(audio.enabled); }
  };

  // Toggle camera on/off — re-attach stream to force UI refresh
  const toggleCam = () => {
    const video = localStream.current?.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setCamOn(video.enabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.srcObject = localStream.current;
      }
    }
  };

  // Go back to previous page when call ends
  const goBack = () => {
    if (onEnd) onEnd();
    else navigate(-1);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: decide icon/label for non-image file types
  // ─────────────────────────────────────────────────────────────────────────
  const getFileIcon = (fileType) => {
    if (fileType === "application/pdf") return "📄";
    if (fileType?.includes("word")) return "📝";
    if (fileType === "text/plain") return "📃";
    return "📁";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#050a12",
      fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* ── All animations and global styles ─────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes ripple    { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.2);opacity:0} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes glow      { 0%,100%{box-shadow:0 0 8px rgba(34,197,94,.4)} 50%{box-shadow:0 0 20px rgba(34,197,94,.8)} }
        @keyframes progress  { from{width:0%} to{width:100%} }

        /* ── Control buttons (mic, cam, chat) ── */
        .vc-ctrl {
          border: none; cursor: pointer; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all .22s cubic-bezier(.22,1,.36,1);
          position: relative; outline: none; flex-shrink: 0;
        }
        .vc-ctrl:hover { transform: scale(1.1); filter: brightness(1.15); }
        .vc-ctrl:active { transform: scale(.92); }

        /* ── Red end call button ── */
        .vc-end {
          border: none; cursor: pointer; border-radius: 50%;
          width: 62px; height: 62px;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          box-shadow: 0 4px 24px rgba(239,68,68,.55);
          display: flex; align-items: center; justify-content: center;
          transition: all .22s cubic-bezier(.22,1,.36,1);
          outline: none; color: #fff;
        }
        .vc-end:hover { transform: scale(1.12); box-shadow: 0 8px 32px rgba(239,68,68,.75); }
        .vc-end:active { transform: scale(.9); }

        /* ── Chat input field ── */
        .vc-input {
          flex: 1; background: rgba(255,255,255,.07);
          border: 1.5px solid rgba(255,255,255,.1);
          border-radius: 24px; padding: 10px 16px;
          color: #fff; font-size: 13.5px; outline: none;
          font-family: inherit; transition: all .18s;
        }
        .vc-input:focus { border-color: rgba(99,179,237,.5); background: rgba(255,255,255,.1); }
        .vc-input::placeholder { color: rgba(255,255,255,.3); }

        /* ── Chat send button ── */
        .vc-send {
          width: 38px; height: 38px; border-radius: 50%; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all .18s; color: #fff;
        }
        .vc-send:hover { transform: scale(1.1); }
        .vc-send:active { transform: scale(.9); }
        .vc-send:disabled { cursor: not-allowed; opacity: .4; transform: none; }

        /* ── NEW: Attach button ── */
        .vc-attach {
          width: 36px; height: 36px; border-radius: 50%; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all .18s;
          background: rgba(255,255,255,.08);
          border: 1.5px solid rgba(255,255,255,.12);
          color: rgba(255,255,255,.6);
        }
        .vc-attach:hover { background: rgba(255,255,255,.14); color: #fff; transform: scale(1.08); }
        .vc-attach:disabled { cursor: not-allowed; opacity: .35; transform: none; }

        /* ── NEW: File preview bubble above input ── */
        .vc-file-preview {
          margin: 0 14px 8px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex; align-items: flex-start; gap: 10px;
          animation: fadeUp .2s ease;
        }
        .vc-file-preview img {
          width: 56px; height: 56px; border-radius: 8px;
          object-fit: cover; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.1);
        }
        .vc-file-cancel {
          width: 22px; height: 22px; border-radius: 50%; border: none;
          background: rgba(239,68,68,.7); color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; margin-left: auto; transition: all .15s;
        }
        .vc-file-cancel:hover { background: rgba(239,68,68,.9); }

        /* ── NEW: Upload progress bar ── */
        .vc-progress-wrap {
          margin: 0 14px 6px;
          height: 4px; background: rgba(255,255,255,.08);
          border-radius: 999px; overflow: hidden;
        }
        .vc-progress-bar {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #1d4ed8, #60a5fa);
          transition: width .2s ease;
        }

        /* ── NEW: Error text ── */
        .vc-file-error {
          margin: 0 14px 6px;
          font-size: 11px; color: #f87171; font-weight: 600;
          animation: fadeUp .2s ease;
        }

        /* ── NEW: File message bubble ── */
        .vc-file-bubble {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 13px; border-radius: 12px;
          max-width: 82%; word-break: break-word;
        }
        .vc-file-bubble.mine {
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          border: none;
          box-shadow: 0 2px 12px rgba(37,99,235,.3);
        }
        .vc-file-bubble.theirs {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.06);
        }
        .vc-dl-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 6px; border: none;
          font-size: 11px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: all .15s;
          background: rgba(255,255,255,.15); color: #fff; text-decoration: none;
          margin-top: 4px;
        }
        .vc-dl-btn:hover { background: rgba(255,255,255,.25); }

        /* ── Call ended / missed / declined screen ── */
        .vc-end-screen {
          position: absolute; inset: 0; z-index: 90;
          background: rgba(5,10,18,.92);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(12px);
          animation: fadeIn .3s ease;
        }
        .vc-end-card {
          background: linear-gradient(160deg, #0d1f35, #0f2a42);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 28px; padding: 48px 52px;
          text-align: center; max-width: 400px; width: 100%;
          box-shadow: 0 32px 80px rgba(0,0,0,.6);
          animation: fadeUp .4s cubic-bezier(.22,1,.36,1);
        }

        /* ── Waiting screen spinner ring ── */
        .vc-spinner {
          width: 96px; height: 96px; border-radius: 50%;
          border: 2px solid rgba(99,179,237,.15);
          position: relative; margin: 0 auto 24px;
          display: flex; align-items: center; justify-content: center;
        }
        .vc-spinner::before {
          content: ''; position: absolute; inset: -8px;
          border-radius: 50%; border: 2px solid transparent;
          border-top-color: rgba(99,179,237,.6);
          animation: spin 1.4s linear infinite;
        }
        .vc-spinner::after {
          content: ''; position: absolute; inset: -16px;
          border-radius: 50%; border: 1.5px solid transparent;
          border-top-color: rgba(99,179,237,.25);
          animation: spin 2s linear infinite reverse;
        }

        /* ── PiP (your own video) hover effect ── */
        .vc-pip { transition: transform .2s, box-shadow .2s; }
        .vc-pip:hover { transform: scale(1.03); box-shadow: 0 12px 36px rgba(0,0,0,.6) !important; }

        /* ── Scrollbar styling for chat ── */
        .vc-chat-scroll::-webkit-scrollbar { width: 4px; }
        .vc-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .vc-chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 999px; }

        /* ── Back button on ended screen ── */
        .vc-back {
          padding: 12px 28px; border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.05); color: rgba(255,255,255,.75);
          font-size: 13.5px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: all .2s;
        }
        .vc-back:hover { border-color: rgba(255,255,255,.45); color: #fff; background: rgba(255,255,255,.1); }

        /* ── Tooltip labels under control buttons ── */
        .vc-label { font-size: 10px; color: rgba(255,255,255,.4); margin-top: 6px; letter-spacing: .4px; font-weight: 500; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          CALL ENDED / DECLINED / MISSED — full screen overlay
      ══════════════════════════════════════════════════════════════════ */}
      {[CALL_STATE.ENDED, CALL_STATE.DECLINED, CALL_STATE.MISSED].includes(callState) && (
        <div className="vc-end-screen">
          <div className="vc-end-card">

            {/* Icon changes based on how call ended */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
              background: callState === CALL_STATE.ENDED
                ? "rgba(239,68,68,.12)" : callState === CALL_STATE.DECLINED
                ? "rgba(239,68,68,.12)" : "rgba(251,191,36,.12)",
              border: `1.5px solid ${callState === CALL_STATE.MISSED ? "rgba(251,191,36,.3)" : "rgba(239,68,68,.3)"}`,
            }}>
              {callState === CALL_STATE.DECLINED ? "📵" : callState === CALL_STATE.MISSED ? "⏰" : "👋"}
            </div>

            {/* Title */}
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-.3px" }}>
              {callState === CALL_STATE.DECLINED ? "Call Declined"
                : callState === CALL_STATE.MISSED ? "Missed Call"
                : "Call Ended"}
            </div>

            {/* Status message from socket */}
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.45)", marginBottom: 28, lineHeight: 1.6 }}>
              {statusMsg}
            </div>

            {/* Show call duration if the call actually connected */}
            {callDuration > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)",
                borderRadius: 999, padding: "8px 18px", marginBottom: 24,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "glow 2s infinite" }}/>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#22c55e", fontVariantNumeric: "tabular-nums" }}>
                  {callDurationFmt}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>duration</span>
              </div>
            )}

            <button className="vc-back" onClick={goBack}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MAIN VIDEO AREA — takes up the whole left side
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, position: "relative", background: "#050a12", overflow: "hidden" }}>

        {/* Remote video — big main screen */}
        <video
          ref={remoteVideoRef}
          autoPlay playsInline
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            background: "#0a0f1a",
            display: "block",
          }}
        />
        <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />

        {/* ── Waiting screen — shown when other person hasn't joined yet ── */}
        {!connected && ![CALL_STATE.ENDED, CALL_STATE.DECLINED, CALL_STATE.MISSED].includes(callState) && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(160deg, #070d1a 0%, #0d1829 100%)",
            animation: "fadeIn .4s ease",
          }}>

            {/* Decorative grid background */}
            <div style={{
              position: "absolute", inset: 0, opacity: .04,
              backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}/>

            {/* Spinning ring with avatar inside */}
            <div className="vc-spinner">
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}>
                {role === "Doctor" ? "🩺" : "👤"}
              </div>
            </div>

            {/* Your name shown while waiting */}
            <div style={{
              fontSize: 22, fontWeight: 700, color: "#fff",
              marginBottom: 8, letterSpacing: "-.3px",
            }}>
              {userName}
            </div>

            {/* Dynamic status message */}
            <div style={{
              fontSize: 14, color: "rgba(255,255,255,.45)",
              marginBottom: 28, fontWeight: 500,
            }}>
              {statusMsg}
            </div>

            {/* Pulsing dots — shows the call is actively waiting */}
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "rgba(99,179,237,.6)",
                  animation: `blink 1.4s ${i * .2}s infinite`,
                }}/>
              ))}
            </div>

            {/* Room ID shown subtly at bottom — useful for debugging */}
            <div style={{
              position: "absolute", bottom: 24,
              fontSize: 11, color: "rgba(255,255,255,.15)",
              letterSpacing: "1px", textTransform: "uppercase",
            }}>
              Room · {roomId?.slice(-8)}
            </div>
          </div>
        )}

        {/* ── Top bar — name tag + live timer (only when connected) ── */}
        {connected && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "16px 20px",
            background: "linear-gradient(to bottom, rgba(0,0,0,.6), transparent)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            animation: "fadeUp .3s ease",
          }}>

            {/* Remote person's name with green live dot */}
            {remoteName && (
              <div style={{
                display: "flex", alignItems: "center", gap: 9,
                background: "rgba(0,0,0,.45)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 999, padding: "7px 16px 7px 10px",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {remoteName[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{remoteName}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "glow 2s infinite" }}/>
                    Live
                  </div>
                </div>
              </div>
            )}

            {/* Call duration timer — big and easy to read */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(239,68,68,.18)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(239,68,68,.35)",
              borderRadius: 999, padding: "7px 16px",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#ef4444",
                animation: "blink 1s infinite",
              }}/>
              <span style={{
                fontSize: 15, fontWeight: 700, color: "#fff",
                fontVariantNumeric: "tabular-nums", letterSpacing: "1px",
              }}>
                {callDurationFmt}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontWeight: 500 }}>REC</span>
            </div>
          </div>
        )}

        {/* ── Your own video (Picture-in-Picture) — bottom right corner ── */}
        <div
          className="vc-pip"
          style={{
            position: "absolute", bottom: 96, right: 18,
            width: 168, height: 126, borderRadius: 16, overflow: "hidden",
            border: "2px solid rgba(255,255,255,.12)",
            boxShadow: "0 8px 28px rgba(0,0,0,.55)",
            background: "#0d1829",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay playsInline muted
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)", // mirror your own video
            }}
          />

          {/* Camera off placeholder */}
          {!camOn && (
            <div style={{
              position: "absolute", inset: 0,
              background: "#0d1829",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <div style={{ fontSize: 22, opacity: .5 }}>📷</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", fontWeight: 600 }}>Camera Off</div>
            </div>
          )}

          {/* "You" label + mic status */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,.7))",
            padding: "12px 8px 6px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>You</span>
            {!micOn && (
              <span style={{
                background: "rgba(239,68,68,.8)", borderRadius: 999,
                padding: "2px 6px", fontSize: 8, color: "#fff", fontWeight: 700,
              }}>MUTED</span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CONTROL BAR — mic, camera, end call, chat
        ══════════════════════════════════════════════════════════════ */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "24px 32px",
          background: "linear-gradient(transparent, rgba(0,0,0,.88))",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>

          {/* Mic toggle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button
              className="vc-ctrl"
              onClick={toggleMic}
              style={{
                width: 52, height: 52,
                background: micOn ? "rgba(255,255,255,.1)" : "rgba(239,68,68,.85)",
                border: micOn ? "1.5px solid rgba(255,255,255,.18)" : "none",
                color: "#fff",
              }}
            >
              {micOn ? <MicOnIcon /> : <MicOffIcon />}
            </button>
            <span className="vc-label">{micOn ? "Mute" : "Unmute"}</span>
          </div>

          {/* Camera toggle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button
              className="vc-ctrl"
              onClick={toggleCam}
              style={{
                width: 52, height: 52,
                background: camOn ? "rgba(255,255,255,.1)" : "rgba(239,68,68,.85)",
                border: camOn ? "1.5px solid rgba(255,255,255,.18)" : "none",
                color: "#fff",
              }}
            >
              {camOn ? <CamOnIcon /> : <CamOffIcon />}
            </button>
            <span className="vc-label">{camOn ? "Stop Video" : "Start Video"}</span>
          </div>

          {/* End call — big red center button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button className="vc-end" onClick={endCall}>
              <EndCallIcon />
            </button>
            <span className="vc-label" style={{ color: "rgba(239,68,68,.7)" }}>End Call</span>
          </div>

          {/* Chat toggle with unread badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button
              className="vc-ctrl"
              onClick={() => setShowChat(p => !p)}
              style={{
                width: 52, height: 52,
                background: showChat ? "rgba(37,99,235,.7)" : "rgba(255,255,255,.1)",
                border: showChat ? "none" : "1.5px solid rgba(255,255,255,.18)",
                color: "#fff",
              }}
            >
              <ChatIcon />
              {/* Unread message badge */}
              {unreadCount > 0 && !showChat && (
                <span style={{
                  position: "absolute", top: -3, right: -3,
                  background: "#ef4444", color: "#fff",
                  borderRadius: 999, fontSize: 9, fontWeight: 800,
                  padding: "2px 5px", border: "2px solid #050a12",
                  minWidth: 16, textAlign: "center",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <span className="vc-label">Chat</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHAT PANEL — slides in from right when chat button clicked
          IDENTICAL layout for both Doctor and Patient
      ══════════════════════════════════════════════════════════════════ */}
      {showChat && (
        <div style={{
          width: 320, background: "#0a1020",
          display: "flex", flexDirection: "column",
          borderLeft: "1px solid rgba(255,255,255,.07)",
          animation: "slideIn .25s cubic-bezier(.22,1,.36,1)",
        }}>

          {/* Chat header */}
          <div style={{
            padding: "16px 18px",
            borderBottom: "1px solid rgba(255,255,255,.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,.02)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>
                💬
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>In-Call Chat</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={() => setShowChat(false)}
              style={{
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                color: "rgba(255,255,255,.5)", width: 28, height: 28, borderRadius: "50%",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, transition: "all .18s",
              }}
            >✕</button>
          </div>

          {/* Messages list */}
          <div
            className="vc-chat-scroll"
            style={{
              flex: 1, overflowY: "auto", padding: "16px 14px",
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            {/* Empty state when no messages yet */}
            {messages.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                flex: 1, gap: 10, color: "rgba(255,255,255,.2)",
                paddingTop: 40,
              }}>
                <div style={{ fontSize: 36, opacity: .4 }}>💬</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No messages yet</div>
                <div style={{ fontSize: 11 }}>Say hello or share a file</div>
              </div>
            )}

            {/* Render each message as a bubble */}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.mine ? "flex-end" : "flex-start",
                  animation: "fadeUp .2s ease",
                  maxWidth: "100%",
                }}
              >
                {/* Sender name — only for messages from the other person */}
                {!m.mine && (
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    color: "rgba(99,179,237,.7)",
                    marginBottom: 3, paddingLeft: 12,
                    letterSpacing: ".3px",
                  }}>
                    {m.senderName}
                  </div>
                )}

                {/* ── TEXT message bubble ── */}
                {m.type === "text" && (
                  <div style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: m.mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.mine
                      ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
                      : "rgba(255,255,255,.08)",
                    border: m.mine ? "none" : "1px solid rgba(255,255,255,.06)",
                    color: "#fff",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                    boxShadow: m.mine ? "0 2px 12px rgba(37,99,235,.3)" : "none",
                  }}>
                    {m.message}
                  </div>
                )}

                {/* ── NEW: FILE / IMAGE message bubble ── */}
                {m.type === "file" && (
                  <div style={{ maxWidth: "82%" }}>
                    {/* Image preview */}
                    {m.fileType?.startsWith("image/") ? (
                      <div style={{
                        borderRadius: m.mine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        overflow: "hidden",
                        border: m.mine ? "none" : "1px solid rgba(255,255,255,.1)",
                        boxShadow: m.mine ? "0 2px 12px rgba(37,99,235,.3)" : "none",
                      }}>
                        <img
                          src={m.fileUrl}
                          alt={m.fileName}
                          style={{ width: "100%", maxWidth: 220, display: "block", cursor: "pointer" }}
                          onClick={() => window.open(m.fileUrl, "_blank")}
                        />
                        <div style={{
                          background: m.mine ? "rgba(29,78,216,.8)" : "rgba(255,255,255,.06)",
                          padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.fileName}
                          </span>
                          <a href={m.fileUrl} download={m.fileName} target="_blank" rel="noreferrer" className="vc-dl-btn">
                            <DownloadIcon /> Save
                          </a>
                        </div>
                      </div>
                    ) : (
                      /* Non-image file */
                      <div className={`vc-file-bubble ${m.mine ? "mine" : "theirs"}`}
                        style={{ flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 22 }}>{getFileIcon(m.fileType)}</span>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {m.fileName}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>
                              {m.fileType === "application/pdf" ? "PDF Document" : "File"}
                            </div>
                          </div>
                        </div>
                        <a href={m.fileUrl} download={m.fileName} target="_blank" rel="noreferrer" className="vc-dl-btn">
                          <DownloadIcon /> Download
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp below each bubble */}
                <div style={{
                  fontSize: 9.5,
                  color: "rgba(255,255,255,.3)",
                  marginTop: 4,
                  paddingLeft: m.mine ? 0 : 4,
                  paddingRight: m.mine ? 4 : 0,
                  fontWeight: 500,
                }}>
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </div>
              </div>
            ))}

            {/* Invisible div at bottom — used to auto-scroll to latest message */}
            <div ref={chatEndRef} />
          </div>

          {/* ── NEW: File error message ── */}
          {fileError && (
            <div className="vc-file-error">{fileError}</div>
          )}

          {/* ── NEW: Upload progress bar ── */}
          {isUploading && (
            <div className="vc-progress-wrap">
              <div className="vc-progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          {/* ── NEW: Pending file preview (before sending) ── */}
          {pendingFile && !isUploading && (
            <div className="vc-file-preview">
              {pendingFile.previewUrl ? (
                <img src={pendingFile.previewUrl} alt="preview" />
              ) : (
                <div style={{
                  width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                  background: "rgba(255,255,255,.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>
                  {getFileIcon(pendingFile.type)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pendingFile.name}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
                  {(pendingFile.file.size / 1024).toFixed(1)} KB · Ready to send
                </div>
              </div>
              <button className="vc-file-cancel" onClick={cancelFile}><XIcon /></button>
            </div>
          )}

          {/* Chat input bar */}
          <div style={{
            padding: "12px 14px",
            borderTop: "1px solid rgba(255,255,255,.06)",
            display: "flex", gap: 8, alignItems: "center",
            background: "rgba(0,0,0,.2)",
          }}>
            {/* ── NEW: Hidden file input ── */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {/* ── NEW: Attach button — opens file picker ── */}
            <button
              className="vc-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Attach file"
            >
              <AttachIcon />
            </button>

            {/* Text input — hidden when a file is pending */}
            {!pendingFile && (
              <input
                className="vc-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message…"
                disabled={isUploading}
              />
            )}

            {/* If file is pending, show "Send file" area instead of text input */}
            {pendingFile && (
              <div style={{
                flex: 1, fontSize: 12, color: "rgba(255,255,255,.45)",
                fontStyle: "italic", paddingLeft: 4,
              }}>
                Press ➤ to send file
              </div>
            )}

            {/* Send button — sends file if pending, else sends text */}
            <button
              className="vc-send"
              onClick={pendingFile ? sendFile : sendMessage}
              disabled={isUploading || (!pendingFile && !chatInput.trim())}
              style={{
                background: (pendingFile || chatInput.trim()) && !isUploading
                  ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
                  : "rgba(255,255,255,.06)",
                boxShadow: (pendingFile || chatInput.trim()) && !isUploading
                  ? "0 2px 12px rgba(37,99,235,.4)"
                  : "none",
              }}
            >
              {isUploading
                ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                : <SendIcon />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
