import mongoose from "mongoose";
import validator from "validator";

const messageSchema = new mongoose.Schema({
  firstName: { type: String, required: true, minLength: [3, "Min 3 Characters!"] },
  lastName: { type: String, required: true, minLength: [3, "Min 3 Characters!"] },
  email: { type: String, required: true, validate: [validator.isEmail, "Provide A Valid Email!"] },
  phone: { type: String, required: true, minLength: [10, "Min 10 Digits!"], maxLength: [11, "Max 11 Digits!"] },
  message: { type: String, required: true, minLength: [10, "Min 10 Characters!"] },
});

export const Message = mongoose.model("Message", messageSchema);
