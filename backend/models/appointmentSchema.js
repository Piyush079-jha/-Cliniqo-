import mongoose from "mongoose";
import validator from "validator";

const appointmentSchema = new mongoose.Schema({
  firstName:   { type: String, required: [true, "First Name Is Required!"],  minLength: [3, "Min 3 Characters!"] },
  lastName:    { type: String, required: [true, "Last Name Is Required!"],   minLength: [3, "Min 3 Characters!"] },
  email:       { type: String, required: [true, "Email Is Required!"],       validate: [validator.isEmail, "Provide A Valid Email!"] },
  phone:       { type: String, required: [true, "Phone Is Required!"],       minLength: [10, "Min 10 Digits!"], maxLength: [11, "Max 11 Digits!"] },
  nic:         { type: String, required: false },
  dob:         { type: Date,   required: [true, "DOB Is Required!"] },
  gender:      { type: String, required: [true, "Gender Is Required!"],      enum: ["Male", "Female"] },

  appointment_date: { type: String, required: [true, "Appointment Date Is Required!"] },
  appointment_time: { type: String, default: null },

  department:  { type: String, required: [true, "Department Is Required!"] },
  doctor: {
    firstName: { type: String, required: [true, "Doctor First Name Is Required!"] },
    lastName:  { type: String, required: [true, "Doctor Last Name Is Required!"]  },
  },
  hasVisited:  { type: Boolean, default: false },
  address:     { type: String,  required: [true, "Address Is Required!"] },
  doctorId:    { type: mongoose.Schema.ObjectId, required: [true, "Doctor Id Is Invalid!"] },
  patientId:   { type: mongoose.Schema.ObjectId, ref: "User", required: [true, "Patient Id Is Required!"] },
  status:      { type: String, enum: ["Pending", "Accepted", "Rejected", "Confirmed", "Completed", "Cancelled"], default: "Pending" },

  videoCallEnabled: { type: Boolean, default: false },

  // ✅ FIX: roomId is always the appointment's own _id (set on creation)
  // This ensures doctor and patient always use the SAME room
  roomId: { type: String, default: null },

}, { timestamps: true });
// Prevents double booking at DB level
appointmentSchema.index(
  { doctorId: 1, appointment_date: 1, appointment_time: 1 },
  { unique: true, sparse: true }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
