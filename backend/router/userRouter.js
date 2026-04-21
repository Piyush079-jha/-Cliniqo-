import express from "express";
import {
  addNewAdmin,
  addNewDoctor,
  getAllDoctors,
  getAllAdmins,
  getUserDetails,
  getDoctorDetails,
  getDoctorAppointments,
  updateAppointmentStatus,
  login,
  logoutAdmin,
  logoutPatient,
  logoutDoctor,
  patientRegister,
  updateAvatar,
  updatePassword,
  updateProfile,
  updateDoctor,
  deleteDoctor,
  deleteAdmin,
  forgotPassword,
  resetPassword,
} from "../controller/userController.js";

import {
  isAdminAuthenticated,
  isPatientAuthenticated,
  isDoctorAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

//  Public
router.post("/patient/register", patientRegister);
router.post("/login", login);                          
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.get("/doctors", getAllDoctors);

// Admin
router.get("/admin/me",           isAdminAuthenticated, getUserDetails);
router.get("/admin/logout",       isAdminAuthenticated, logoutAdmin);
router.get("/admins",             isAdminAuthenticated, getAllAdmins);
router.post("/admin/addnew",      isAdminAuthenticated, addNewAdmin);
router.post("/doctor/addnew",     isAdminAuthenticated, addNewDoctor);
router.put("/avatar/update/admin",   isAdminAuthenticated, updateAvatar);
router.put("/password/update/admin", isAdminAuthenticated, updatePassword);
router.put("/profile/update/admin",  isAdminAuthenticated, updateProfile);
router.put("/doctor/update/:id",     isAdminAuthenticated, updateDoctor);
router.delete("/doctor/delete/:id",  isAdminAuthenticated, deleteDoctor);
router.delete("/admin/delete/:id",   isAdminAuthenticated, deleteAdmin);

//  Patient 
router.get("/patient/me",          isPatientAuthenticated, getUserDetails);
router.get("/patient/logout",      isPatientAuthenticated, logoutPatient);
router.put("/avatar/update",       isPatientAuthenticated, updateAvatar);
router.put("/password/update",     isPatientAuthenticated, updatePassword);
router.put("/profile/update",      isPatientAuthenticated, updateProfile);

//  Doctor
router.get("/doctor/me",           isDoctorAuthenticated, getDoctorDetails);
router.get("/doctor/logout",       isDoctorAuthenticated, logoutDoctor);
router.get("/doctor/appointments", isDoctorAuthenticated, getDoctorAppointments);
router.put("/doctor/appointment/:id/status", isDoctorAuthenticated, updateAppointmentStatus);
router.put("/password/update/doctor", isDoctorAuthenticated, updatePassword);
router.put("/profile/update/doctor",  isDoctorAuthenticated, updateProfile);
export default router;