import express from "express";
import {
  createPrescription,
  getDoctorPrescriptions,
  getPatientPrescriptions,
  getAllPrescriptions,
  updatePrescriptionStatus,
} from "../controller/prescriptionController.js";
import {
  isPatientAuthenticated,
  isAdminAuthenticated,
  isDoctorAuthenticated,
} from "../middlewares/auth.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Prescription } from "../models/prescriptionSchema.js";

const router = express.Router();

// ── Doctor routes ──────────────────────────────────────────────────────────
router.post("/create", isDoctorAuthenticated, createPrescription);
router.get("/mine",    isDoctorAuthenticated, getDoctorPrescriptions);
router.put("/:id",     isDoctorAuthenticated, updatePrescriptionStatus);

// ── Patient routes ─────────────────────────────────────────────────────────
// GET  /api/v1/prescription/patient/mine
router.get("/patient/mine", isPatientAuthenticated, getPatientPrescriptions);

// DELETE /api/v1/prescription/delete/:id
router.delete(
  "/delete/:id",
  isPatientAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) return res.status(404).json({ success: false, message: "Prescription not found" });
    await rx.deleteOne();
    res.status(200).json({ success: true, message: "Prescription deleted" });
  })
);

// ── Admin routes ───────────────────────────────────────────────────────────
router.get("/all", isAdminAuthenticated, getAllPrescriptions);

export default router;