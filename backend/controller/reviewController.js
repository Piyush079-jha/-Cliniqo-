import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Review } from "../models/reviewSchema.js";


// GET ALL reviews — public (used by AboutUs page)

export const getAllReviews = catchAsyncErrors(async (req, res, next) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, reviews });
});


// POST a general review — patient only (AboutUs page, no specific doctor)

export const postGeneralReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return next(new ErrorHandler("Please provide rating and comment!", 400));
  }

  const patientId   = req.user._id;
  const patientName = `${req.user.firstName} ${req.user.lastName}`;

  // One general review per patient (no doctor attached)
  const existing = await Review.findOne({ patientId, doctorId: null });
  if (existing) {
    return next(
      new ErrorHandler(
        "You have already posted a general review. Please edit your existing one.",
        400
      )
    );
  }

  const review = await Review.create({
    doctorId:    null,   
    patientId,
    patientName,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    review,
    message: "Review posted successfully!",
  });
});

export const postReview = catchAsyncErrors(async (req, res, next) => {
  const { doctorId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return next(new ErrorHandler("Please provide rating and comment!", 400));
  }

  const patientId   = req.user._id;
  const patientName = `${req.user.firstName} ${req.user.lastName}`;

  // One review per patient per doctor
  const existing = await Review.findOne({ patientId, doctorId });
  if (existing) {
    return next(
      new ErrorHandler(
        "You have already reviewed this doctor. Please edit your existing review.",
        400
      )
    );
  }

  const review = await Review.create({
    doctorId,
    patientId,
    patientName,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    review,
    message: "Review posted successfully!",
  });
});


export const getDoctorReviews = catchAsyncErrors(async (req, res, next) => {
  const { doctorId } = req.params;
  const reviews = await Review.find({ doctorId }).sort({ createdAt: -1 });

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  res.status(200).json({
    success: true,
    reviews,
    avgRating,
    totalReviews: reviews.length,
  });
});


export const updateReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  let review = await Review.findById(id);
  if (!review) return next(new ErrorHandler("Review not found!", 404));

  
  if (review.patientId.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("You are not authorized to edit this review!", 403)
    );
  }

  review = await Review.findByIdAndUpdate(
    id,
    { rating, comment },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    review,
    message: "Review updated successfully!",
  });
});
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) return next(new ErrorHandler("Review not found!", 404));

 
  const isOwner = review.patientId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "Admin";

  if (!isOwner && !isAdmin) {
    return next(
      new ErrorHandler("You are not authorized to delete this review!", 403)
    );
  }

  await review.deleteOne();
  res.status(200).json({ success: true, message: "Review deleted successfully!" });
});