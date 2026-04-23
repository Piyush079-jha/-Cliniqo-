import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import express from "express";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import { errorMiddleware } from "./middlewares/error.js";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
import messageRouter from "./router/messageRouter.js";
import userRouter from "./router/userRouter.js";
import appointmentRouter from "./router/appointmentRouter.js";
import reviewRouter from "./router/reviewRouter.js";
import availabilityRouter from "./router/availabilityRouter.js";
import aiRouter from "./router/aiRouter.js";
import videoRouter from "./router/videoRouter.js";
import prescriptionRouter from "./router/prescriptionRouter.js";
import videoConsultationRouter from "./router/videoConsultationRouter.js";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "https://cliniqo-ten.vercel.app",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Global limiter — protects all routes from abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // generous enough for normal use
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", globalLimiter);

// Stricter limiter for AI routes specifically
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/ai", aiLimiter);
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  // Skip express-fileupload for multer-handled routes
  if (req.path === "/api/v1/videoconsult/upload-file") return next();
  fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" })(req, res, next);
});

app.use("/api/v1/message",      messageRouter);
app.use("/api/v1/user",         userRouter);
app.use("/api/v1/appointment",  appointmentRouter);
app.use("/api/v1/review",       reviewRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/ai",           aiRouter);
app.use("/api/v1/prescription", prescriptionRouter);
app.use("/api/v1/video",        videoRouter);
app.use("/api/v1/videoconsult", videoConsultationRouter);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Cliniqo API is running" });
});

app.use(errorMiddleware);
export default app;