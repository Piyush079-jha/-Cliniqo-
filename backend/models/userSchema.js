import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name Is Required!"],
    minLength: [3, "First Name Must Contain At Least 3 Characters!"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name Is Required!"],
    minLength: [3, "First Name Must Contain At Least 3 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Email Is Required!"],
    validate: [validator.isEmail, "Provide A Valid Email!"],
  },
  phone: {
    type: String,
    required: [true, "Phone Is Required!"],
    minLength: [10, "Phone Number Must Contain At Least 10 Digits!"],
    maxLength: [11, "Phone Number Must Contain Max 11 Digits!"],
  },
  // nic: {
  //   type: String,
  //   // Optional for Patients — required only for Admin/Doctor via controller validation
  //   minLength: [13, "NIC Must Contain Only 13 Digits!"],
  //   maxLength: [13, "NIC Must Contain Only 13 Digits!"],
  // },
  dob: {
    type: Date,
    required: [true, "DOB Is Required!"],
  },
  gender: {
    type: String,
    required: [true, "Gender Is Required!"],
    enum: ["Male", "Female"],
  },
  password: {
    type: String,
    required: [true, "Password Is Required!"],
    minLength: [8, "Password Must Contain At Least 8 Characters!"],
    select: false,
  },
  role: {
    type: String,
    required: [true, "User Role Required!"],
    enum: ["Patient", "Doctor", "Admin"],
  },
  doctorDepartment: { type: String },
  docAvatar: {
    public_id: String,
    url: String,
  },
  // Profile avatar for all users (patients, admins)
  avatar: {
    public_id: String,
    url: String,
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    days: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
  },
  schedule: {
    Mon: { start: { type: String, default: "" }, end: { type: String, default: "" } },
    Tue: { start: { type: String, default: "" }, end: { type: String, default: "" } },
    Wed: { start: { type: String, default: "" }, end: { type: String, default: "" } },
    Thu: { start: { type: String, default: "" }, end: { type: String, default: "" } },
    Fri: { start: { type: String, default: "" }, end: { type: String, default: "" } },
    Sat: { start: { type: String, default: "" }, end: { type: String, default: "" } },
    Sun: { start: { type: String, default: "" }, end: { type: String, default: "" } },
  },
});

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) next();
//   this.password = await bcrypt.hash(this.password, 10);
// });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); 
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

export const User = mongoose.model("User", userSchema);