import express from "express";
import {
  postAppointment,
  getAllAppointments,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getBookedSlots,
} from "../controller/appointmentController.js";
import {
  isPatientAuthenticated,
  isAdminAuthenticated,
  isDoctorAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// ── Slot availability ──────────────────────────────────────────────────────
router.get("/booked-slots", isPatientAuthenticated, getBookedSlots);

// ── Patient routes ─────────────────────────────────────────────────────────
router.post("/post",         isPatientAuthenticated, postAppointment);
router.get( "/patient/mine", isPatientAuthenticated, getMyAppointments);

// ── Doctor routes ──────────────────────────────────────────────────────────
router.get( "/doctor/mine",       isDoctorAuthenticated, getDoctorAppointments);
router.put( "/doctor/update/:id", isDoctorAuthenticated, updateAppointmentStatus);

// ── Admin routes ───────────────────────────────────────────────────────────
router.get(    "/getall",     isAdminAuthenticated, getAllAppointments);
router.put(    "/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.delete( "/delete/:id", isAdminAuthenticated, deleteAppointment);

export default router;