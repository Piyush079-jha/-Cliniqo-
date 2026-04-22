import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

// Patient books a new appointment
export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName, lastName, email, phone, dob, gender,
    appointment_date, appointment_time,
    department, doctor_firstName, doctor_lastName,
    hasVisited, address,
  } = req.body;

  if (
    !firstName || !lastName || !email || !phone || !dob || !gender ||
    !appointment_date || !department || !doctor_firstName || !doctor_lastName || !address
  ) {
    return next(new ErrorHandler("Please fill the full form!", 400));
  }

  const isConflict = await User.find({
    firstName: doctor_firstName,
    lastName: doctor_lastName,
    role: "Doctor",
    doctorDepartment: department,
  });

  if (isConflict.length === 0)
    return next(new ErrorHandler("Doctor not found!", 404));
  if (isConflict.length > 1)
    return next(new ErrorHandler("Doctors conflict! Please contact through email or phone.", 400));

  const doctorId  = isConflict[0]._id;
  const patientId = req.user._id;

  // ✅ Double booking prevention — check BEFORE creating
  if (appointment_time) {
    const existing = await Appointment.findOne({
      doctorId,
      appointment_date,
      appointment_time,
      status: { $nin: ["Rejected", "Cancelled"] },
    });
    if (existing) {
      return next(
        new ErrorHandler(
          `The slot ${appointment_time} is already booked. Please choose another time.`,
          409
        )
      );
    }
  }

  const appointment = await Appointment.create({
    firstName, lastName, email, phone, dob, gender,
    appointment_date,
    appointment_time: appointment_time || null,
    department,
    doctor: { firstName: doctor_firstName, lastName: doctor_lastName },
    hasVisited: hasVisited || false,
    address,
    doctorId,
    patientId,
    status: "Pending",
    videoCallEnabled: false,
  });

  // ✅ Use appointment's own _id as roomId
  appointment.roomId = appointment._id.toString();
  await appointment.save();

  res.status(200).json({
    success: true,
    appointment,
    message: "Appointment booked successfully!",
  });
});

// Admin: get ALL appointments
export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, appointments });
});

// Patient: get only their own appointments
export const getMyAppointments = catchAsyncErrors(async (req, res, next) => {
  const patientId = req.user._id;
  const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, appointments });
});

// Doctor: get only appointments assigned to them
export const getDoctorAppointments = catchAsyncErrors(async (req, res, next) => {
  const doctorId = req.user._id;

  const appointments = await Appointment.find({ doctorId }).sort({ createdAt: -1 });

  const notifications = appointments
    .filter((a) => a.status === "Pending")
    .slice(0, 10)
    .map((a) => ({
      id:   a._id,
      type: "appointment",
      text: `New appointment request from ${a.firstName} ${a.lastName}`,
      time: a.createdAt,
      read: false,
    }));

  res.status(200).json({ success: true, appointments, notifications });
});

// Doctor / Admin: update appointment status
export const updateAppointmentStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  let appointment = await Appointment.findById(id);
  if (!appointment)
    return next(new ErrorHandler("Appointment not found!", 404));

  if (req.user.role === "Doctor" && String(appointment.doctorId) !== String(req.user._id)) {
    return next(new ErrorHandler("You are not authorised to update this appointment.", 403));
  }

  // ✅ AUTO-ENABLE video call when Accepted or Confirmed
  if (["Accepted", "Confirmed"].includes(req.body.status)) {
    req.body.videoCallEnabled = true;
    req.body.acceptedAt = new Date();
  }

  // ✅ DISABLE video call if Rejected or Cancelled
  if (["Rejected", "Cancelled"].includes(req.body.status)) {
    req.body.videoCallEnabled = false;
  }

  // ✅ Ensure roomId is always set
  if (!appointment.roomId) {
    req.body.roomId = appointment._id.toString();
  }

  appointment = await Appointment.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  // ✅ Notify patient via socket when video call is enabled
  const io = req.app.get("io");
  if (io && appointment.videoCallEnabled) {
    io.to(`patient_${appointment.patientId}`).emit("video-call-enabled", {
      appointmentId: appointment._id,
      roomId: appointment.roomId,
      message: "Your doctor has confirmed your appointment. You can now request a video consultation!",
    });
  }

  res.status(200).json({
    success: true,
    appointment,
    message: "Appointment status updated!",
  });
});

// Admin: delete appointment
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment)
    return next(new ErrorHandler("Appointment not found!", 404));
  await appointment.deleteOne();
  res.status(200).json({ success: true, message: "Appointment deleted!" });
});

// ✅ Get booked slots for a doctor on a specific date
export const getBookedSlots = catchAsyncErrors(async (req, res, next) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return next(new ErrorHandler("doctorId and date are required", 400));
  }

  const appointments = await Appointment.find({
    doctorId,
    appointment_date: date,
    status: { $nin: ["Rejected", "Cancelled"] },
  }).select("appointment_time");

  const bookedSlots = appointments
    .map((a) => a.appointment_time)
    .filter(Boolean);

  res.status(200).json({ success: true, bookedSlots });
});