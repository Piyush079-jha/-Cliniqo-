// backend/controller/videoFileController.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles file uploads during a video consultation chat
// Uses Multer (memory storage) → Cloudinary
// ─────────────────────────────────────────────────────────────────────────────

import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler          from "../middlewares/error.js";
import cloudinary            from "cloudinary";
import multer                from "multer";

// ── Multer: store file in memory (buffer), not on disk ───────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed. Use images, PDF, Word, or text files."), false);
  }
};

// ── Export multer middleware so the router can use it ─────────────────────────
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/videoconsult/upload-file
// Authenticated (patient or doctor)
// Uploads file buffer to Cloudinary and returns the secure URL
// ─────────────────────────────────────────────────────────────────────────────
export const uploadChatFile = catchAsyncErrors(async (req, res, next) => {
  console.log("[Upload] Cloudinary config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "MISSING",
    api_key:    process.env.CLOUDINARY_API_KEY    ? "SET" : "MISSING",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
  });

  if (!req.file) {
    return next(new ErrorHandler("No file provided", 400));
  }

  // Determine Cloudinary resource type
  const isImage = req.file.mimetype.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  // Convert buffer to base64 data URI for Cloudinary upload
  const base64 = req.file.buffer.toString("base64");
  const dataUri = `data:${req.file.mimetype};base64,${base64}`;

  // Upload to Cloudinary inside the cliniqo/video-chat folder
  const result = await cloudinary.v2.uploader.upload(dataUri, {
    resource_type: resourceType,
    folder:        "cliniqo/video-chat",
    // Use original file name (sanitised) as public_id
    public_id:     `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`,
    // Auto-quality for images
    ...(isImage && { quality: "auto", fetch_format: "auto" }),
  });

  res.status(200).json({
    success: true,
    fileUrl:  result.secure_url,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    publicId: result.public_id,
  });
});