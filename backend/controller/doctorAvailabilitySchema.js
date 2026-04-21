import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { DoctorAvailability } from "../models/doctorAvailabilitySchema.js";
import { Appointment } from "../models/appointmentSchema.js";

// ─── DOCTOR: Save / update weekly schedule ───────────────────────────────────
export const setAvailability = catchAsyncErrors(async (req, res, next) => {
  const doctorId = req.user._id;
  const { weeklySchedule, blockedDates, slotDuration } = req.body;

  const availability = await DoctorAvailability.findOneAndUpdate(
    { doctorId },
    { weeklySchedule, blockedDates, slotDuration },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Availability saved successfully!",
    availability,
  });
});

// ─── DOCTOR: Block a specific date ───────────────────────────────────────────
export const blockDate = catchAsyncErrors(async (req, res, next) => {
  const doctorId = req.user._id;
  const { date } = req.body; // "YYYY-MM-DD"

  if (!date) return next(new ErrorHandler("Date is required", 400));

  const availability = await DoctorAvailability.findOneAndUpdate(
    { doctorId },
    { $addToSet: { blockedDates: date } },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, message: `${date} blocked.`, availability });
});

// ─── DOCTOR: Unblock a specific date ─────────────────────────────────────────
export const unblockDate = catchAsyncErrors(async (req, res, next) => {
  const doctorId = req.user._id;
  const { date } = req.body;

  if (!date) return next(new ErrorHandler("Date is required", 400));

  const availability = await DoctorAvailability.findOneAndUpdate(
    { doctorId },
    { $pull: { blockedDates: date } },
    { new: true }
  );

  res.status(200).json({ success: true, message: `${date} unblocked.`, availability });
});

// ─── DOCTOR: Get own availability ─────────────────────────────────────────────
export const getMyAvailability = catchAsyncErrors(async (req, res, next) => {
  const doctorId = req.user._id;
  let availability = await DoctorAvailability.findOne({ doctorId });

  // Return sensible defaults if not set yet
  if (!availability) {
    availability = {
      weeklySchedule: {
        monday: { enabled: false, slots: [] },
        tuesday: { enabled: false, slots: [] },
        wednesday: { enabled: false, slots: [] },
        thursday: { enabled: false, slots: [] },
        friday: { enabled: false, slots: [] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      },
      blockedDates: [],
      slotDuration: 30,
    };
  }

  res.status(200).json({ success: true, availability });
});

// ─── PUBLIC: Get available slots for a doctor on a specific date ──────────────
// Used by patients during appointment booking
export const getAvailableSlots = catchAsyncErrors(async (req, res, next) => {
  const { doctorId, date } = req.query; // date = "YYYY-MM-DD"

  if (!doctorId || !date) {
    return next(new ErrorHandler("doctorId and date are required", 400));
  }

  const availability = await DoctorAvailability.findOne({ doctorId });

  if (!availability) {
    return res.status(200).json({ success: true, slots: [], blocked: false });
  }

  // Check if the date is explicitly blocked
  if (availability.blockedDates.includes(date)) {
    return res.status(200).json({ success: true, slots: [], blocked: true });
  }

  // Determine day of week from date string
  const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayIndex = new Date(date).getDay();
  const dayKey   = dayNames[dayIndex];
  const daySchedule = availability.weeklySchedule[dayKey];

  if (!daySchedule || !daySchedule.enabled || daySchedule.slots.length === 0) {
    return res.status(200).json({ success: true, slots: [], blocked: false });
  }

  // Fetch already-booked appointments for this doctor on this date
  const booked = await Appointment.find({
    doctorId,
    appointment_date: date,
    status: { $in: ["Pending", "Accepted", "Confirmed"] },
  }).select("appointment_time");

  const bookedTimes = new Set(booked.map(a => a.appointment_time).filter(Boolean));

  // Mark each slot as available or taken
  const slots = daySchedule.slots.map(slot => ({
    start: slot.start,
    end:   slot.end,
    available: !bookedTimes.has(slot.start),
  }));

  res.status(200).json({ success: true, slots, blocked: false });
});

// ─── PUBLIC: Get doctor's blocked dates (for calendar UI) ────────────────────
export const getDoctorBlockedDates = catchAsyncErrors(async (req, res, next) => {
  const { doctorId } = req.params;
  const availability = await DoctorAvailability.findOne({ doctorId });

  res.status(200).json({
    success: true,
    blockedDates: availability?.blockedDates || [],
  });
});