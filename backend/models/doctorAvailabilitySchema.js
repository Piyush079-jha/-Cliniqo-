import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  start: { type: String, required: true }, // "09:00"
  end:   { type: String, required: true }, // "09:30"
}, { _id: false });

const dayAvailabilitySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  slots:   { type: [timeSlotSchema], default: [] },
}, { _id: false });

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Weekly recurring schedule — keyed by lowercase day name
    weeklySchedule: {
      monday:    { type: dayAvailabilitySchema, default: () => ({}) },
      tuesday:   { type: dayAvailabilitySchema, default: () => ({}) },
      wednesday: { type: dayAvailabilitySchema, default: () => ({}) },
      thursday:  { type: dayAvailabilitySchema, default: () => ({}) },
      friday:    { type: dayAvailabilitySchema, default: () => ({}) },
      saturday:  { type: dayAvailabilitySchema, default: () => ({}) },
      sunday:    { type: dayAvailabilitySchema, default: () => ({}) },
    },

    // Specific dates the doctor has blocked (YYYY-MM-DD strings)
    blockedDates: {
      type: [String],
      default: [],
    },

    // Slot duration in minutes (default 30)
    slotDuration: {
      type: Number,
      default: 30,
      enum: [15, 30, 45, 60],
    },
  },
  { timestamps: true }
);

export const DoctorAvailability = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);