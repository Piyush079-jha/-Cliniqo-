import express from "express";
import {
  deleteReview,
  getDoctorReviews,
  getAllReviews,
  postReview,
  postGeneralReview,
  updateReview,
} from "../controller/reviewController.js";
import {
  isAdminAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

//  Public

// Anyone can read reviews (used by AboutUs page and Doctors page)
router.get("/getall", getAllReviews);
router.get("/doctor/:doctorId", getDoctorReviews);

// ─ Patient only 

// Only logged-in patients can post or edit their own reviews
router.post("/post", isPatientAuthenticated, postGeneralReview);
router.post("/doctor/:doctorId/post", isPatientAuthenticated, postReview);
router.put("/update/:id", isPatientAuthenticated, updateReview);


// Patient deletes their own review
router.delete("/delete/:id", isPatientAuthenticated, deleteReview);

// Admin deletes any review (spam control )
router.delete("/admin/delete/:id", isAdminAuthenticated, deleteReview);

export default router;