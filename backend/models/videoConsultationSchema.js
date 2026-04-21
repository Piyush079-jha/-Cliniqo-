import mongoose from "mongoose";

const videoConsultationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required"],
    },
    patientName:  { type: String, required: [true, "Patient name is required"] },
    patientEmail: { type: String, default: "" },

    doctorId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
    },
    doctorName: { type: String, default: "" },

    appointmentId: {
      type: mongoose.Schema.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // ── Call lifecycle timestamps ──────────────────────────────────────────
    startedAt:   { type: Date, default: null },
    endedAt:     { type: Date, default: null },
    ringingAt:   { type: Date, default: null }, // when doctor started call
    acceptedAt:  { type: Date, default: null }, // when patient accepted
    declinedAt:  { type: Date, default: null }, // when patient declined

    // ── Room info ─────────────────────────────────────────────────────────
    roomId: { type: String, default: null }, // WebRTC room ID

    // ── Call duration in seconds ──────────────────────────────────────────
    durationSeconds: { type: Number, default: 0 },

    // ── Status ────────────────────────────────────────────────────────────
    // Full lifecycle:
    // Pending → Accepted → Ringing → Active → Ended
    //                    → Declined
    //                    → Missed (timeout)
    //         → Rejected (doctor rejects patient request)
    //         → Completed
    status: {
      type: String,
      enum: [
        "Pending",    // patient requested, doctor hasn't responded
        "Accepted",   // doctor accepted patient's request
        "Rejected",   // doctor rejected patient's request
        "Ringing",    // doctor started call, waiting for patient to accept
        "Active",     // both joined, call in progress
        "Declined",   // patient declined incoming call
        "Missed",     // patient didn't answer in time
        "Ended",      // call ended normally
        "Completed",  // marked complete by doctor
      ],
      default: "Pending",
    },

    // ── Optional note from doctor on rejection ────────────────────────────
    rejectionNote: { type: String, default: "" },

    // ── Reconnect count ───────────────────────────────────────────────────
    reconnectCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const VideoConsultation = mongoose.model(
  "VideoConsultation",
  videoConsultationSchema
);