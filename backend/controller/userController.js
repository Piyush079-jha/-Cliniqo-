import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import bcrypt from "bcrypt";
import crypto from "crypto";
import SibApiV3Sdk from "@getbrevo/brevo";

const brevoClient1 = new SibApiV3Sdk.TransactionalEmailsApi();
brevoClient1.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY_1);

const brevoClient2 = new SibApiV3Sdk.TransactionalEmailsApi();
brevoClient2.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY_2);

const sendBrevoEmail = async (emailData) => {
  try {
    await brevoClient1.sendTransacEmail(emailData);
  } catch (err1) {
    console.error("Brevo key 1 failed, trying key 2:", err1.message);
    await brevoClient2.sendTransacEmail(emailData);
  }
};
import { Appointment } from "../models/appointmentSchema.js"; 
export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, dob, gender, password } = req.body;
  if (!firstName || !lastName || !email || !phone || !dob || !gender || !password) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const isRegistered = await User.findOne({ email });
  if (isRegistered) return next(new ErrorHandler("User already Registered!", 400));
  const user = await User.create({
    firstName, lastName, email, phone, dob, gender, password, role: "Patient",
  });
  generateToken(user, "User Registered!", 200, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please fill all required fields!", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid email or password!", 400));
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) return next(new ErrorHandler("Invalid email or password!", 400));
  if (role !== user.role) return next(new ErrorHandler("User not found with this role!", 400));
  generateToken(user, "Login Successfully!", 200, res);
});

export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, dob, gender, password } = req.body;
  if (!firstName || !lastName || !email || !phone || !dob || !gender || !password) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const isRegistered = await User.findOne({ email });
  if (isRegistered)
    return next(new ErrorHandler(`${isRegistered.role} With This Email Already Exists!`, 400));
  const admin = await User.create({
    firstName, lastName, email, phone, dob, gender, password, role: "Admin",
  });
  res.status(200).json({ success: true, message: "New Admin Registered!", admin });
});

export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Doctor Avatar Required!", 400));
  }
  const { docAvatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype)) {
    return next(new ErrorHandler("File Format Not Supported! Use PNG, JPEG, or WEBP.", 400));
  }
  const { firstName, lastName, email, phone, nic, dob, gender, password, doctorDepartment } = req.body;
  if (!firstName || !lastName || !email || !phone || !nic || !dob || !gender || !password || !doctorDepartment) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const isRegistered = await User.findOne({ email });
  if (isRegistered)
    return next(new ErrorHandler("Doctor With This Email Already Exists!", 400));
  const cloudinaryResponse = await cloudinary.v2.uploader.upload(docAvatar.tempFilePath);
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    return next(new ErrorHandler("Failed To Upload Doctor Avatar To Cloudinary!", 500));
  }
  const doctor = await User.create({
    firstName, lastName, email, phone, nic, dob, gender, password,
    role: "Doctor", doctorDepartment,
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  res.status(200).json({ success: true, message: "New Doctor Registered!", doctor });
});

export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({ success: true, doctors });
});

export const getAllAdmins = catchAsyncErrors(async (req, res, next) => {
  const admins = await User.find({ role: "Admin" });
  res.status(200).json({ success: true, admins });
});

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({ success: true, user });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, phone, gender, dob } = req.body;
  const updatedData = {};
  if (firstName) updatedData.firstName = firstName;
  if (lastName)  updatedData.lastName  = lastName;
  if (phone)     updatedData.phone     = phone;
  if (gender)    updatedData.gender    = gender;
  if (dob)       updatedData.dob       = dob;
  const user = await User.findByIdAndUpdate(req.user._id, updatedData, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: "Profile updated successfully!", user });
});

export const updateAvatar = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || !req.files.avatar) {
    return next(new ErrorHandler("Please upload an image!", 400));
  }
  const { avatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
  if (!allowedFormats.includes(avatar.mimetype)) {
    return next(new ErrorHandler("Only PNG, JPG, JPEG and WEBP formats are supported!", 400));
  }
  const user = await User.findById(req.user._id);
  if (user.avatar && user.avatar.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }
  const cloudinaryResponse = await cloudinary.v2.uploader.upload(avatar.tempFilePath, {
    folder: "cliniqo_avatars", width: 300, height: 300, crop: "fill", gravity: "face",
  });
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    return next(new ErrorHandler("Failed to upload avatar!", 500));
  }
  user.avatar = { public_id: cloudinaryResponse.public_id, url: cloudinaryResponse.secure_url };
  await user.save();
  res.status(200).json({ success: true, message: "Profile picture updated!", avatar: user.avatar });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("Please fill all fields!", 400));
  }
  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("New password and confirm password do not match!", 400));
  }
  if (newPassword.length < 8) {
    return next(new ErrorHandler("Password must be at least 8 characters!", 400));
  }
  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return next(new ErrorHandler("Current password is incorrect!", 400));
  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: "Password updated successfully!" });
});

export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res.status(201)
    .cookie("adminToken", "", { httpOnly: true, expires: new Date(Date.now()), sameSite: "none", secure: true })
    .json({ success: true, message: "Admin Logged Out Successfully." });
});

export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res.status(201)
    .cookie("patientToken", "", { httpOnly: true, expires: new Date(Date.now()), sameSite: "none", secure: true })
    .json({ success: true, message: "Patient Logged Out Successfully." });
});

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, nic, dob, gender, doctorDepartment } = req.body;
    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== "Doctor") {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    const updated = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, email, phone, nic, dob, gender, doctorDepartment },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: "Doctor updated successfully", doctor: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteDoctor = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const doctor = await User.findById(id);
  if (!doctor || doctor.role !== "Doctor") {
    return next(new ErrorHandler("Doctor not found!", 404));
  }
  if (doctor.docAvatar && doctor.docAvatar.public_id) {
    await cloudinary.v2.uploader.destroy(doctor.docAvatar.public_id);
  }
  await doctor.deleteOne();
  res.status(200).json({ success: true, message: "Doctor removed successfully!" });
});

export const deleteAdmin = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (req.user._id.toString() === id) {
    return next(new ErrorHandler("You cannot delete your own account!", 400));
  }
  const admin = await User.findById(id);
  if (!admin || admin.role !== "Admin") {
    return next(new ErrorHandler("Admin not found!", 404));
  }
  await admin.deleteOne();
  res.status(200).json({ success: true, message: "Admin removed successfully!" });
});

// ── FORGOT PASSWORD ──────────────────────────────────────────
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorHandler("Please provide your email!", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("No account found with this email!", 404));

  // Generate a random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash it before saving to DB
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken   = hashedToken;
  user.resetPasswordExpire  = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  // Build reset URL (frontend route)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Send email via Brevo with dual key fallback
  try {
    await sendBrevoEmail({
      sender: { name: "Cliniqo HMS", email: process.env.SENDER_EMAIL },
      to: [{ email: user.email, name: user.firstName }],
      subject: "Cliniqo — Password Reset Request",
      htmlContent: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#f4f6f4;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0b3324,#1a6644);padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:-0.5px;">Clini<span style="color:#c9a84c;font-style:italic;">qo</span></h1>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:6px 0 0;">Hospital Management System</p>
        </div>
        <div style="padding:36px 40px;">
          <h2 style="color:#0b3324;font-size:22px;margin:0 0 10px;">Password Reset Request</h2>
          <p style="color:#637a6e;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Hi <strong>${user.firstName}</strong>, we received a request to reset your Cliniqo password.
            Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a6644,#0b3324);color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:700;">
            Reset My Password →
          </a>
          <p style="color:#a0b4ac;font-size:12px;margin:24px 0 0;line-height:1.6;">
            If you didn't request this, you can safely ignore this email. Your password will not change.<br/>
            This link will expire at <strong>${new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString()}</strong>.
          </p>
        </div>
        <div style="background:#e6efe9;padding:16px 40px;text-align:center;">
          <p style="color:#8faa9a;font-size:11px;margin:0;">© 2025 Cliniqo. All rights reserved.</p>
        </div>
      </div>
    `,
    });
    res.status(200).json({ success: true, message: `Password reset link sent to ${user.email}` });
  } catch (err) {
    console.error("Brevo email error:", err?.response?.body || err.message);
    return next(new ErrorHandler("Failed to send email. Please try again!", 500));
  }
});

//  RESET PASSWORD 
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return next(new ErrorHandler("Please fill all fields!", 400));
  }
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match!", 400));
  }
  if (password.length < 8) {
    return next(new ErrorHandler("Password must be at least 8 characters!", 400));
  }

  // Hash the token from URL to compare with DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpire: { $gt: Date.now() }, // token must not be expired
  });

  if (!user) return next(new ErrorHandler("Reset link is invalid or has expired!", 400));

  user.password            = password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: "Password reset successfully! You can now log in." });
});
// ─── ADD THESE EXPORTS TO YOUR EXISTING userController.js ───────────────────

// Doctor logout — clears doctorToken cookie
export const logoutDoctor = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("doctorToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      sameSite: "none",
      secure: true,
    })
    .json({ success: true, message: "Doctor Logged Out Successfully." });
});

// Get authenticated doctor's own details (used by /doctor/me)
export const getDoctorDetails = catchAsyncErrors(async (req, res, next) => {
  const doctor = req.user;
  res.status(200).json({ success: true, user: doctor });
});

// Get doctor's own appointments (all appointments assigned to this doctor)
export const getDoctorAppointments = catchAsyncErrors(async (req, res, next) => {
  const { Appointment } = await import("../models/appointmentSchema.js");
  const appointments = await Appointment.find({ doctorId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, appointments });
});
export const updateDoctorSchedule = async (req, res) => {
  const { availability, schedule } = req.body;
  const doctor = await User.findByIdAndUpdate(
    req.user._id,
    { availability, schedule },
    { new: true }
  );
  res.status(200).json({ success: true, doctor });
};
// Update appointment status (doctor action: confirm / complete / cancel)
export const updateAppointmentStatus = catchAsyncErrors(async (req, res, next) => {
  const { Appointment } = await import("../models/appointmentSchema.js");
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];
  if (!allowed.includes(status)) {
    return next(new ErrorHandler("Invalid status value!", 400));
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) return next(new ErrorHandler("Appointment not found!", 404));

  // Only the assigned doctor can update
  if (appointment.doctorId.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to update this appointment!", 403));
  }

  appointment.status = status;
  await appointment.save();
  res.status(200).json({ success: true, message: "Appointment status updated!", appointment });
  
});