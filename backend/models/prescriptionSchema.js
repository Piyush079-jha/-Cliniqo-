import mongoose from "mongoose";

const drugSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  dose:      { type: String, default: "" },
  frequency: { type: String, default: "" },
  duration:  { type: String, default: "" },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema(
  {
    // Link back to the appointment (optional — doctor may write standalone Rx)
    appointmentId: {
      type: mongoose.Schema.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // Doctor who issued it
    doctorId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
    },
    doctorName: { type: String, default: "" },

    // Patient details
    patientId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      default: null,
    },
    patientName:  { type: String, required: [true, "Patient name is required"] },
    patientAge:   { type: String, default: "" },
    patientEmail: { type: String, default: "" },

    // Clinical content
    diagnosis: { type: String, required: [true, "Diagnosis is required"] },
    drugs:     { type: [drugSchema], required: true },
    notes:     { type: String, default: "" },

    // Status so patient can see if it was viewed
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);