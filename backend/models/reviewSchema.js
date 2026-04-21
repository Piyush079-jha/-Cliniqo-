import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      default: null,
    },
    patientId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required!"],
    },
    patientName: {
      type: String,
      required: [true, "Patient name is required!"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required!"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required!"],
      minLength: [10, "Comment must be at least 10 characters!"],
      maxLength: [500, "Comment cannot exceed 500 characters!"],
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);