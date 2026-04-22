import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { VideoConsultation } from "../models/videoConsultationSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

const getIO = (req) => req.app.get("io");

// ─────────────────────────────────────────────────────────────────────────────
// Patient: Create a video consultation request
// POST /api/v1/videoconsult/request
// ─────────────────────────────────────────────────────────────────────────────
export const createRequest = catchAsyncErrors(async (req, res, next) => {
  const { appointmentId } = req.body;

  if (!appointmentId)
    return next(new ErrorHandler("Appointment ID is required", 400));

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment)
    return next(new ErrorHandler("Appointment not found", 404));

  if (String(appointment.patientId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised for this appointment", 403));

  if (!["Accepted", "Confirmed", "Completed"].includes(appointment.status))
  return next(new ErrorHandler(
    "Video consultation can only be requested for Accepted, Confirmed or Completed appointments", 400
  ));
  if (!appointment.videoCallEnabled)
    return next(new ErrorHandler(
      "Video consultation is not enabled for this appointment yet.", 400
    ));

  // Prevent duplicate pending requests
  const existing = await VideoConsultation.findOne({
    appointmentId,
    status: { $in: ["Pending", "Accepted", "Ringing"] },
  });
  if (existing) {
    return res.status(200).json({
      success: true,
      consultation: existing,
      message: "Video consultation request already exists",
    });
  }
// If acceptedAt is missing, fall back to appointment's updatedAt
  const windowStart = appointment.acceptedAt || appointment.updatedAt;
  const windowEnd   = new Date(new Date(windowStart).getTime() + 24 * 60 * 60 * 1000);
  const now         = new Date();

  if (now > windowEnd) {
    return next(new ErrorHandler(
      "The 24-hour window for video consultation requests has expired.", 400
    ));
  }

  const requestCount = await VideoConsultation.countDocuments({
    appointmentId,
    patientId: req.user._id,
    createdAt: { $gte: windowStart, $lte: windowEnd },
  });

  if (requestCount >= 3) {
    return next(new ErrorHandler(
      "You have reached the maximum of 3 video consultation requests for this appointment.", 400
    ));
  }a
  const doctor = await User.findById(appointment.doctorId);
  const doctorName = doctor
    ? `Dr. ${doctor.firstName} ${doctor.lastName}`
    : `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

  // ✅ FIX: Store the roomId from the appointment (not frontend-generated)
  const roomId = appointment.roomId || appointment._id.toString();

  const consultation = await VideoConsultation.create({
    patientId:    req.user._id,
    patientName:  `${req.user.firstName} ${req.user.lastName}`,
    patientEmail: req.user.email || "",
    doctorId:     appointment.doctorId,
    doctorName,
    appointmentId,
    roomId, // ✅ stored from the start
    status: "Pending",
  });

 // Notify doctor
  const io = getIO(req);
  console.log(`[createRequest] Emitting to doctor_${appointment.doctorId}`);
  if (io) {
    io.to(`doctor_${appointment.doctorId}`).emit("new-video-request", {
      consultation,
      message: `${consultation.patientName} has requested a video consultation`,
    });
  }
  res.status(201).json({
    success: true,
    consultation,
    message: "Video consultation request sent to the doctor",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Patient: Get their own video consultation requests
// GET /api/v1/videoconsult/patient/mine
// ─────────────────────────────────────────────────────────────────────────────
export const getPatientRequests = catchAsyncErrors(async (req, res, next) => {
  const consultations = await VideoConsultation.find({ patientId: req.user._id })
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, consultations });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Get all requests assigned to them
// GET /api/v1/videoconsult/doctor/mine
// ─────────────────────────────────────────────────────────────────────────────
export const getDoctorRequests = catchAsyncErrors(async (req, res, next) => {
  const consultations = await VideoConsultation.find({ doctorId: req.user._id })
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, consultations });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Accept patient's request
// PUT /api/v1/videoconsult/:id/accept
// ─────────────────────────────────────────────────────────────────────────────
export const acceptRequest = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Request not found", 404));
  if (String(consultation.doctorId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised", 403));
  if (!["Pending", "Ringing"].includes(consultation.status))
    return next(new ErrorHandler("Only pending or ringing requests can be accepted", 400));

  consultation.status = "Accepted";
  await consultation.save();

  const io = getIO(req);
  if (io) {
    io.to(`patient_${consultation.patientId}`).emit("video-request-accepted", {
      consultationId: consultation._id,
      appointmentId:  consultation.appointmentId,
      roomId:         consultation.roomId,
      doctorName:     consultation.doctorName,
      message: `${consultation.doctorName} has accepted your video consultation request`,
    });
  }

  res.status(200).json({ success: true, consultation, message: "Request accepted" });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Reject patient's request
// PUT /api/v1/videoconsult/:id/reject
// ─────────────────────────────────────────────────────────────────────────────
export const rejectRequest = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Request not found", 404));
  if (String(consultation.doctorId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised", 403));
  if (!["Pending", "Ringing"].includes(consultation.status))
    return next(new ErrorHandler("Only pending or ringing requests can be rejected", 400));

  consultation.status        = "Rejected";
  consultation.rejectionNote = req.body.rejectionNote || "";
  await consultation.save();

  const io = getIO(req);
  if (io) {
    io.to(`patient_${consultation.patientId}`).emit("video-request-rejected", {
      consultationId: consultation._id,
      message:        `${consultation.doctorName} has declined your video consultation request`,
      rejectionNote:  consultation.rejectionNote,
    });
  }

  res.status(200).json({ success: true, consultation, message: "Request rejected" });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Start the video call (moves to Ringing state)
// PUT /api/v1/videoconsult/:id/start
// ✅ FIX: roomId now comes from the consultation/appointment — NOT from frontend
// ─────────────────────────────────────────────────────────────────────────────
export const startCall = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Consultation not found", 404));
  if (String(consultation.doctorId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised", 403));
  if (consultation.status !== "Accepted")
    return next(new ErrorHandler("Can only start an accepted consultation", 400));

  // ✅ FIX: Use roomId already stored in consultation (set from appointment._id)
  // Never trust roomId from frontend — it will be different for doctor and patient
  const roomId = consultation.roomId;
  if (!roomId) return next(new ErrorHandler("Room ID not found. Please contact support.", 500));

  consultation.status    = "Ringing";
  consultation.ringingAt = new Date();
  await consultation.save();

  // ✅ Notify patient with the SAME roomId doctor will use
  const io = getIO(req);
  if (io) {
    io.to(`patient_${consultation.patientId}`).emit("incoming-call", {
      consultationId: consultation._id,
      roomId,         // ✅ same roomId both sides will use
      doctorName:     consultation.doctorName,
      message:        `${consultation.doctorName} is calling you`,
    });
    console.log(`[startCall] Emitting incoming-call to patient_${consultation.patientId} → roomId: ${roomId}`);
  }

  // Auto-mark as Missed after 45 seconds if patient doesn't respond
  setTimeout(async () => {
    try {
      const fresh = await VideoConsultation.findById(consultation._id);
      if (fresh && fresh.status === "Ringing") {
        fresh.status = "Missed";
        await fresh.save();

        if (io) {
          io.to(`doctor_${consultation.doctorId}`).emit("call-missed", {
            consultationId: consultation._id,
            patientName:    consultation.patientName,
            message:        `${consultation.patientName} didn't answer the call`,
          });
        }
      }
    } catch (err) {
      console.error("Missed call timeout error:", err.message);
    }
  }, 45_000);

  res.status(200).json({
    success: true,
    consultation,
    roomId, // ✅ return it so doctor's frontend can navigate to /video/:roomId
    message: "Call started — patient is being notified",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Patient: Accept incoming call
// PUT /api/v1/videoconsult/:id/patient-accept
// ─────────────────────────────────────────────────────────────────────────────
export const patientAcceptCall = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Consultation not found", 404));
  if (String(consultation.patientId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised", 403));
  if (consultation.status !== "Ringing")
    return next(new ErrorHandler("No active incoming call", 400));

  consultation.status     = "Active";
  consultation.acceptedAt = new Date();
  await consultation.save();

  // Notify doctor that patient accepted
  const io = getIO(req);
  if (io) {
    io.to(`doctor_${consultation.doctorId}`).emit("patient-accepted-call", {
      consultationId: consultation._id,
      patientName:    consultation.patientName,
      roomId:         consultation.roomId,
      message:        `${consultation.patientName} accepted the call`,
    });
  }

  res.status(200).json({
    success: true,
    consultation,
    roomId: consultation.roomId, // ✅ patient uses this to navigate
    message: "Call accepted — joining now",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Patient: Decline incoming call
// PUT /api/v1/videoconsult/:id/patient-decline
// ─────────────────────────────────────────────────────────────────────────────
export const patientDeclineCall = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Consultation not found", 404));
  if (String(consultation.patientId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised", 403));
  if (consultation.status !== "Ringing")
    return next(new ErrorHandler("No active incoming call to decline", 400));

  consultation.status     = "Declined";
  consultation.declinedAt = new Date();
  await consultation.save();

  const io = getIO(req);
  if (io) {
    io.to(`doctor_${consultation.doctorId}`).emit("call-declined", {
      consultationId: consultation._id,
      patientName:    consultation.patientName,
      message:        `${consultation.patientName} declined the call`,
    });
  }

  res.status(200).json({ success: true, consultation, message: "Call declined" });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor or Patient: End the call
// PUT /api/v1/videoconsult/:id/end
// ─────────────────────────────────────────────────────────────────────────────
export const endCall = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Consultation not found", 404));

  const isDoctor  = String(consultation.doctorId)  === String(req.user._id);
  const isPatient = String(consultation.patientId) === String(req.user._id);
  if (!isDoctor && !isPatient)
    return next(new ErrorHandler("Not authorised", 403));

  const endTime  = new Date();
  const duration = consultation.acceptedAt
    ? Math.floor((endTime - new Date(consultation.acceptedAt)) / 1000)
    : 0;

  consultation.status          = "Ended";
  consultation.endedAt         = endTime;
  consultation.durationSeconds = duration;
  await consultation.save();

  const io = getIO(req);
  if (io) {
    io.to(`doctor_${consultation.doctorId}`).emit("call-ended-notify", {
      consultationId: consultation._id,
      endedBy:        isDoctor ? "Doctor" : "Patient",
      duration,
      message:        "The call has ended",
    });
    io.to(`patient_${consultation.patientId}`).emit("call-ended-notify", {
      consultationId: consultation._id,
      endedBy:        isDoctor ? "Doctor" : "Patient",
      duration,
      message:        "The call has ended",
    });
  }

  res.status(200).json({ success: true, consultation, duration, message: "Call ended" });
});

// ─────────────────────────────────────────────────────────────────────────────
// Patient: Request reconnect after call ends
// POST /api/v1/videoconsult/:id/reconnect
// ─────────────────────────────────────────────────────────────────────────────
export const reconnectCall = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Consultation not found", 404));
  if (String(consultation.patientId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised", 403));

  const allowedStatuses = ["Ended", "Declined", "Missed"];
  if (!allowedStatuses.includes(consultation.status))
    return next(new ErrorHandler("Cannot reconnect from current state", 400));

  // ✅ Keep the roomId — same room, new session
  consultation.status         = "Pending";
  consultation.ringingAt      = null;
  consultation.acceptedAt     = null;
  consultation.declinedAt     = null;
  consultation.endedAt        = null;
  consultation.reconnectCount = (consultation.reconnectCount || 0) + 1;
  await consultation.save();

  const io = getIO(req);
  if (io) {
    io.to(`doctor_${consultation.doctorId}`).emit("reconnect-request", {
      consultationId:  consultation._id,
      patientName:     consultation.patientName,
      roomId:          consultation.roomId,
      reconnectCount:  consultation.reconnectCount,
      message:         `${consultation.patientName} wants to reconnect the call`,
    });
  }

  res.status(200).json({ success: true, consultation, message: "Reconnect request sent to doctor" });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Complete consultation
// PUT /api/v1/videoconsult/:id/complete
// ─────────────────────────────────────────────────────────────────────────────
export const completeRequest = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findById(req.params.id);
  if (!consultation) return next(new ErrorHandler("Request not found", 404));
  if (String(consultation.doctorId) !== String(req.user._id))
    return next(new ErrorHandler("Not authorised", 403));
  if (!["Accepted", "Ended", "Active"].includes(consultation.status))
    return next(new ErrorHandler("Cannot complete from current state", 400));

  consultation.status  = "Completed";
  consultation.endedAt = new Date();
  await consultation.save();

  const io = getIO(req);
  if (io) {
    io.to(`patient_${consultation.patientId}`).emit("video-consultation-completed", {
      consultationId: consultation._id,
      message:        "Your video consultation has been marked as completed",
    });
  }

  res.status(200).json({ success: true, consultation, message: "Consultation completed" });
});

export const endCallByRoom = catchAsyncErrors(async (req, res, next) => {
  const consultation = await VideoConsultation.findOne({
    roomId: req.params.roomId,
    status: { $in: ["Active", "Ringing"] },
  });
  if (!consultation) return res.status(200).json({ success: true, message: "Nothing to end" });

  const endTime = new Date();
  const duration = consultation.acceptedAt
    ? Math.floor((endTime - new Date(consultation.acceptedAt)) / 1000)
    : 0;

  consultation.status          = "Ended";
  consultation.endedAt         = endTime;
  consultation.durationSeconds = duration;
  await consultation.save();

  res.status(200).json({ success: true, message: "Call ended", duration });
});