import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const MessageForm = () => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "https://cliniqo-backend.onrender.com/api/v1/message/send",
        form,
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      toast.success(res.data.message);
      setForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="message-section container" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
      <span className="section-tag">Contact Us</span>
      <h2>Get In Touch With Our Team</h2>
      <p style={{ color: "var(--text-gray)", marginBottom: "48px" }}>
        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
      </p>

      <div className="message-grid">
        {/* Contact info */}
        <div className="contact-info">
          <h3>Contact Information</h3>
          <div className="contact-item">
            <div className="contact-icon"><FaPhone /></div>
            <div>
              <h5>Phone</h5>
              <p>+91 96311 63498</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon"><FaEnvelope /></div>
            <div>
              <h5>Email</h5>
              <p>piyushjha1134@gmail.com</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon"><FaMapMarkerAlt /></div>
            <div>
              <h5>Location</h5>
              <p>Bhubaneswar, Odisha, India</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="message-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                {/* placeholder is generic — no pre-filled personal info */}
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Your first name" required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Your last name" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Your phone number" required />
              </div>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Write your message here..." required />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default MessageForm;
