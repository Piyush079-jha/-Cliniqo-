import mongoose from "mongoose";

const videoSessionSchema = new mongoose.Schema(
  {
    doctor:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorName:    { type: String, required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    patientEmail:  { type: String, default: null, index: true },
    roomId:        { type: String, required: true },
    roomUrl:       { type: String, required: true },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const VideoSession = mongoose.model("VideoSession", videoSessionSchema);