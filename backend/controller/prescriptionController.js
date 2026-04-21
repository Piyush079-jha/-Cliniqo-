import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Prescription } from "../models/prescriptionSchema.js";
import { Appointment } from "../models/appointmentSchema.js";

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Create a new prescription
// POST /api/v1/prescription/create   (isDoctorAuthenticated)
// ─────────────────────────────────────────────────────────────────────────────
import sanitize from "mongo-sanitize";

export const createPrescription = catchAsyncErrors(async (req, res, next) => {
const { appointmentId, patientId, patientName, patientAge, patientEmail, diagnosis, drugs, notes } = sanitize(req.body);

  if (!patientName || !diagnosis || !drugs || drugs.length === 0) {
    return next(new ErrorHandler("Patient name, diagnosis and at least one drug are required", 400));
  }

  const doctorId   = req.user._id;
  const doctorName = `${req.user.firstName} ${req.user.lastName}`;

  // If linked to an appointment, verify it belongs to this doctor
  if (appointmentId) {
    const appt = await Appointment.findById(appointmentId);
    if (!appt) return next(new ErrorHandler("Linked appointment not found", 404));
    if (String(appt.doctorId) !== String(doctorId)) {
      return next(new ErrorHandler("Not authorised for this appointment", 403));
    }
  }

  const prescription = await Prescription.create({
    appointmentId: appointmentId || null,
    doctorId,
    doctorName,
    patientId:    patientId    || null,
    patientName,
    patientAge:   patientAge   || "",
    patientEmail: patientEmail || "",
    diagnosis,
    drugs,
    notes: notes || "",
  });

  res.status(201).json({
    success: true,
    prescription,
    message: "Prescription saved — patient can view it in their dashboard",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Get all prescriptions they have written
// GET /api/v1/prescription/mine   (isDoctorAuthenticated)
// ─────────────────────────────────────────────────────────────────────────────
export const getDoctorPrescriptions = catchAsyncErrors(async (req, res, next) => {
  const prescriptions = await Prescription.find({ doctorId: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, prescriptions });
});

// ─────────────────────────────────────────────────────────────────────────────
// Patient: Get all prescriptions written for them
// Matches by patientId (if registered) OR patientEmail (as fallback)
// GET /api/v1/prescription/patient/mine   (isAuthenticated)
// ─────────────────────────────────────────────────────────────────────────────
export const getPatientPrescriptions = catchAsyncErrors(async (req, res, next) => {
  const patientId    = req.user._id;
  const patientEmail = req.user.email;

  const prescriptions = await Prescription.find({
    $or: [
      { patientId: patientId },
      { patientEmail: patientEmail },
    ],
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, prescriptions });
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Get ALL prescriptions
// GET /api/v1/prescription/all   (isAdminAuthenticated)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllPrescriptions = catchAsyncErrors(async (req, res, next) => {
  const prescriptions = await Prescription.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, prescriptions });
});

// ─────────────────────────────────────────────────────────────────────────────
// Doctor: Update prescription status
// PUT /api/v1/prescription/:id   (isDoctorAuthenticated)
// ─────────────────────────────────────────────────────────────────────────────
export const updatePrescriptionStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  let prescription = await Prescription.findById(id);

  if (!prescription) return next(new ErrorHandler("Prescription not found", 404));

  if (String(prescription.doctorId) !== String(req.user._id)) {
    return next(new ErrorHandler("Not authorised to update this prescription", 403));
  }

  prescription = await Prescription.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, prescription, message: "Prescription updated" });
});