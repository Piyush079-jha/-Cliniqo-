// ✅ STEP 1: Load env FIRST before any other import
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import app from "./app.js";
import { dbConnection } from "./database/dbConnection.js";
import cloudinary from "cloudinary";
import { createServer } from "http";
import { Server } from "socket.io";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:      process.env.FRONTEND_URL || "http://localhost:5173",
    methods:     ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
});

app.set("io", io);

const rooms = {};
const userSockets = {};

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("register", ({ userId, role }) => {
    if (!userId) return;
    userSockets[userId] = socket.id;
    const room = `${role?.toLowerCase()}_${userId}`;
    socket.join(room);
    console.log(`Registered ${role} ${userId} → room ${room}`);
  });

  socket.on("vc-accepted-notify", ({ doctorId }) => {
    io.to(`doctor_${doctorId}`).emit("vc-accepted-notify");
  });

  socket.on("start-video-call", ({ patientId, appointmentId, roomId, doctorName, consultationId }) => {
    io.to(`patient_${patientId}`).emit("incoming-call", {
      consultationId,
      roomId,
      appointmentId,
      doctorName,
      message: `${doctorName} is calling you`,
    });
    console.log(`Doctor calling patient_${patientId} → room ${roomId}`);
  });

  socket.on("patient-accept-call", ({ consultationId, roomId, patientName }) => {
    console.log(`[socket] patient-accept-call: ${patientName} → room ${roomId}`);
  });

  socket.on("patient-decline-call", ({ consultationId, patientName }) => {
    console.log(`[socket] patient-decline-call: ${patientName}`);
  });

  socket.on("reconnect-request", ({ doctorId, consultationId, patientName }) => {
    io.to(`doctor_${doctorId}`).emit("reconnect-request", {
      consultationId,
      patientName,
      message: `${patientName} wants to reconnect`,
    });
  });

  socket.on("join-room", ({ roomId, userId, userName, role }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId] = rooms[roomId].filter(p => p.userId !== userId);
    rooms[roomId].push({ socketId: socket.id, userId, userName, role });
    socket.to(roomId).emit("user-joined", {
      socketId: socket.id, userId, userName, role,
    });
    socket.emit("room-participants",
      rooms[roomId].filter(p => p.socketId !== socket.id)
    );
    console.log(`${userName} (${role}) joined video room ${roomId}`);
  });

  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("chat-message", ({ roomId, message, senderName, senderId }) => {
    socket.to(roomId).emit("chat-message", {
      message, senderName, senderId,
      timestamp: new Date().toISOString(),
      mine: false,
    });
    socket.emit("chat-message-sent", {
      message, senderName, senderId,
      timestamp: new Date().toISOString(),
      mine: true,
    });
  });

  socket.on("chat-file", ({ roomId, fileUrl, fileName, fileType, senderName, senderId }) => {
    socket.to(roomId).emit("chat-file", {
      fileUrl, fileName, fileType, senderName, senderId,
      timestamp: new Date().toISOString(),
      mine: false,
    });
    socket.emit("chat-file-sent", {
      fileUrl, fileName, fileType, senderName, senderId,
      timestamp: new Date().toISOString(),
      mine: true,
    });
  });

  socket.on("end-call", ({ roomId, endedBy, consultationId }) => {
    socket.to(roomId).emit("call-ended", {
      endedBy, consultationId,
      message: `${endedBy} ended the call`,
    });
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(p => p.socketId !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, sid] of Object.entries(userSockets)) {
      if (sid === socket.id) {
        delete userSockets[userId];
        break;
      }
    }
    for (const roomId in rooms) {
      const before = rooms[roomId].length;
      rooms[roomId] = rooms[roomId].filter(p => p.socketId !== socket.id);
      if (rooms[roomId].length < before) {
        socket.to(roomId).emit("user-left", { socketId: socket.id });
        if (rooms[roomId].length === 0) delete rooms[roomId];
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

export { io };

// ✅ STEP 2: Connect DB first, THEN start the server
const startServer = async () => {
  try {
    await dbConnection(process.env.MONGO_URI); // waits for MongoDB
    
    httpServer.listen(process.env.PORT, () => {
      console.log(`🚀 Server + Socket.io listening on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();