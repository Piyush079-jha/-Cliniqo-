import express from "express";
import {
  setAvailability,
  blockDate,
  unblockDate,
  getMyAvailability,
  getAvailableSlots,
  getDoctorBlockedDates,
} from "../controller/availabilityController.js";
import { isDoctorAuthenticated, isPatientAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

//  Doctor-only routes (must be logged in as Doctor) 
router.put("/set",     isDoctorAuthenticated, setAvailability);
router.post("/block",   isDoctorAuthenticated, blockDate);
router.post("/unblock", isDoctorAuthenticated, unblockDate);
router.get("/mine",     isDoctorAuthenticated, getMyAvailability);

// Public routes (patients use these when booking) 
router.get("/slots", getAvailableSlots);                       
router.get("/blocked/:doctorId", getDoctorBlockedDates);        

export default router;

