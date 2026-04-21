import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { DoctorAvailability } from "../models/doctorAvailabilitySchema.js";
import { Appointment } from "../models/appointmentSchema.js";

// ─── Helper: Generate default 9AM–5PM slots every 30 mins ───────────────────
const generateDefaultSlots = (slotDuration = 30) => {
  const slots = [];
  let current = 9 * 60; // 9:00 AM in minutes
  const end   = 17 * 60; // 5:00 PM in minutes
  while (current < end) {
    const startH = Math.floor(current / 60);
    const startM = current % 60;
    const endMin = current + slotDuration;
    const endH   = Math.floor(endMin / 60);
    const endMm  = endMin % 60;
    slots.push({
      start: `${String(startH).padStart(2,"0")}:${String(startM).padStart(2,"0")}`,
      end:   `${String(endH).padStart(2,"0")}:${String(endMm).padStart(2,"0")}`,
    });
    current += slotDuration;
  }
  return slots;
};

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
  const { date } = req.body;

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

  if (!availability) {
    // Return default enabled schedule so doctor sees something meaningful
    const defaultSlots = generateDefaultSlots(30);
    availability = {
      weeklySchedule: {
        monday:    { enabled: true,  slots: defaultSlots },
        tuesday:   { enabled: true,  slots: defaultSlots },
        wednesday: { enabled: true,  slots: defaultSlots },
        thursday:  { enabled: true,  slots: defaultSlots },
        friday:    { enabled: true,  slots: defaultSlots },
        saturday:  { enabled: true,  slots: defaultSlots },
        sunday:    { enabled: false, slots: [] },
      },
      blockedDates: [],
      slotDuration: 30,
    };
  }

  res.status(200).json({ success: true, availability });
});

// ─── PUBLIC: Get available slots for a doctor on a specific date ──────────────
export const getAvailableSlots = catchAsyncErrors(async (req, res, next) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return next(new ErrorHandler("doctorId and date are required", 400));
  }

  const availability = await DoctorAvailability.findOne({ doctorId });

  // ✅ If date is blocked — return blocked flag
  if (availability?.blockedDates?.includes(date)) {
    return res.status(200).json({ success: true, slots: [], blocked: true });
  }

  // ✅ Determine which slots to use:
  // Priority 1 — doctor's custom schedule for this day (if enabled + has slots)
  // Priority 2 — default 9AM–5PM slots (Mon–Sat)
  const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayKey   = dayNames[new Date(date).getDay()];
  const isSunday = dayKey === "sunday";

  let baseSlots = [];

  if (availability) {
    const daySchedule = availability.weeklySchedule?.[dayKey];
    const hasCustomSlots = daySchedule?.enabled && daySchedule?.slots?.length > 0;

    if (hasCustomSlots) {
      // Doctor has configured this day — use their custom slots
      baseSlots = daySchedule.slots.map(s => ({ start: s.start, end: s.end }));
    } else if (daySchedule?.enabled === false) {
      // Doctor explicitly disabled this day — respect that
      return res.status(200).json({ success: true, slots: [], blocked: false });
    } else {
      // Doctor has an availability doc but hasn't configured this day yet
      // → Fall back to default slots (unless Sunday)
      baseSlots = isSunday ? [] : generateDefaultSlots(availability.slotDuration || 30);
    }
  } else {
    // ✅ No availability doc at all → use system defaults (Mon–Sat, 9AM–5PM)
    baseSlots = isSunday ? [] : generateDefaultSlots(30);
  }

  if (baseSlots.length === 0) {
    return res.status(200).json({ success: true, slots: [], blocked: false });
  }

  // ✅ Fetch real booked appointments for this doctor on this date
  const booked = await Appointment.find({
    doctorId,
    appointment_date: date,
    status: { $in: ["Pending", "Accepted", "Confirmed"] },
  }).select("appointment_time");

  const bookedTimes = new Set(
    booked.map(a => a.appointment_time).filter(Boolean)
  );

  // ✅ Mark each slot as available or taken based on real bookings
  const slots = baseSlots.map(slot => ({
    start:     slot.start,
    end:       slot.end,
    available: !bookedTimes.has(slot.start),
  }));

  res.status(200).json({ success: true, slots, blocked: false });
});

// ─── PUBLIC: Get doctor's blocked dates ──────────────────────────────────────
export const getDoctorBlockedDates = catchAsyncErrors(async (req, res, next) => {
  const { doctorId } = req.params;
  const availability = await DoctorAvailability.findOne({ doctorId });

  res.status(200).json({
    success: true,
    blockedDates: availability?.blockedDates || [],
  });
});