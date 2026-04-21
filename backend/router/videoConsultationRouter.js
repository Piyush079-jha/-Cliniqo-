// backend/router/videoConsultationRouter.js
// ── UPDATED: Added /upload-file route for in-call media sharing ──────────────

import express from "express";
import {
  createRequest, getPatientRequests, getDoctorRequests,
  acceptRequest, rejectRequest, startCall,
  patientAcceptCall, patientDeclineCall,
  endCall, endCallByRoom, reconnectCall, completeRequest,
} from "../controller/videoConsultationController.js";
import {
  isPatientAuthenticated,
  isDoctorAuthenticated,
} from "../middlewares/auth.js";

// ── NEW: import the file upload controller and multer middleware ──────────────
import { upload, uploadChatFile } from "../controller/videoFileController.js";

const router = express.Router();

// ── Patient routes ────────────────────────────────────────────────────────
router.post("/request",                isPatientAuthenticated, createRequest);
router.get( "/patient/mine",           isPatientAuthenticated, getPatientRequests);
router.put( "/:id/patient-accept",     isPatientAuthenticated, patientAcceptCall);
router.put( "/:id/patient-decline",    isPatientAuthenticated, patientDeclineCall);
router.post("/:id/reconnect",          isPatientAuthenticated, reconnectCall);

// ── Doctor routes ─────────────────────────────────────────────────────────
router.get( "/doctor/mine",            isDoctorAuthenticated,  getDoctorRequests);
router.put( "/:id/accept",             isDoctorAuthenticated,  acceptRequest);
router.put( "/:id/reject",             isDoctorAuthenticated,  rejectRequest);
router.put( "/:id/start",              isDoctorAuthenticated,  startCall);
router.put( "/:id/complete",           isDoctorAuthenticated,  completeRequest);

// ── Shared (doctor or patient can end) ────────────────────────────────────
router.put( "/:id/end",                endCall); // auth checked inside controller
router.put( "/end-by-room/:roomId",    endCallByRoom);

// ── NEW: File upload during video chat (both patient AND doctor) ───────────
// /upload-file must come BEFORE the /:id routes to avoid being caught by them
router.post(
  "/upload-file",
  (req, res, next) => {
    // Determine which auth middleware to use based on cookie present
    // isPatientAuthenticated checks patientToken, isDoctorAuthenticated checks doctorToken
    // We try patient first, then doctor — first one that passes wins
    isPatientAuthenticated(req, res, (patientErr) => {
      if (!patientErr) return next(); // patient authenticated ✅
      isDoctorAuthenticated(req, res, (doctorErr) => {
        if (!doctorErr) return next(); // doctor authenticated ✅
        // Neither — return the patient error (more descriptive)
        return next(patientErr);
      });
    });
  },
  upload.single("file"),   // multer processes the file field named "file"
  uploadChatFile           // controller uploads to Cloudinary, returns URL
);

export default router;