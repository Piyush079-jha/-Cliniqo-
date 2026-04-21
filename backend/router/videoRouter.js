import express from "express";
import {
  createVideoSession,
  getPatientVideoSession,
  getDoctorVideoSessions,
  endVideoSession,
} from "../controller/videoController.js";
import { isDoctorAuthenticated, isPatientAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Doctor
router.post("/create",  isDoctorAuthenticated,  createVideoSession);
router.get( "/doctor",  isDoctorAuthenticated,  getDoctorVideoSessions);
router.put( "/:id/end", isDoctorAuthenticated,  endVideoSession);

// Patient
router.get( "/patient", isPatientAuthenticated, getPatientVideoSession);

export default router;