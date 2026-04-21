import { VideoSession } from "../models/videoSessionSchema.js";

// ── POST /api/v1/video/create ─────────────────────────────────────────────────
// Doctor creates a video session and optionally links it to an appointment
export const createVideoSession = async (req, res, next) => {
  try {
    const { appointmentId, patientEmail, roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ success: false, message: "roomId is required" });
    }

    // Deactivate any previous active sessions for this doctor
    await VideoSession.updateMany(
      { doctor: req.user._id, isActive: true },
      { isActive: false }
    );

    const session = await VideoSession.create({
      doctor: req.user._id,
      doctorName: `${req.user.firstName} ${req.user.lastName}`,
      appointmentId: appointmentId || null,
      patientEmail: patientEmail?.toLowerCase().trim() || null,
      roomId,
      roomUrl: `https://meet.jit.si/${roomId}`,
      isActive: true,
    });

    res.status(201).json({ success: true, message: "Video session created", session });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/video/patient ─────────────────────────────────────────────────
// Patient checks if their doctor has an active session for them
export const getPatientVideoSession = async (req, res, next) => {
  try {
    const email = req.user.email?.toLowerCase().trim();

    const session = await VideoSession.findOne({
      patientEmail: email,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, session: session || null });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/video/doctor ──────────────────────────────────────────────────
// Doctor fetches their active/recent sessions
export const getDoctorVideoSessions = async (req, res, next) => {
  try {
    const sessions = await VideoSession.find({ doctor: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/v1/video/:id/end ─────────────────────────────────────────────────
export const endVideoSession = async (req, res, next) => {
  try {
    await VideoSession.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user._id },
      { isActive: false }
    );
    res.json({ success: true, message: "Session ended" });
  } catch (err) {
    next(err);
  }
};