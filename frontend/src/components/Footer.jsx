import React from "react";
import { Link } from "react-router-dom";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaLinkedin, FaGithub, FaInstagram } from "react-icons/fa";

const Footer = () => {
  const hours = [
    { day: "Mon – Fri",  time: "9:00 AM – 9:00 PM" },
    { day: "Saturday",   time: "10:00 AM – 6:00 PM" },
    { day: "Sunday",     time: "10:00 AM – 4:00 PM" },
  ];

  return (
    <>
      <style>{`
        footer {
          background: #1a3d2e;
          color: #e2e8f0;
          padding: 56px 80px 32px;
          position: relative;
          overflow: hidden;
        }

        /* Square grid pattern — same as login/register left panel */
        footer::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
          z-index: 0;
        }

        /* Gold top accent line */
        footer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #c9a84c 35%, #e8cc80 50%, #c9a84c 65%, transparent 100%);
          opacity: 0.85;
          z-index: 2;
          pointer-events: none;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
          position: relative; z-index: 1;
        }

        /* Brand */
        .footer-brand .f-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 700;
          color: #ffffff;
          margin-bottom: 14px;
          display: block;
        }
        .footer-brand .f-logo em {
          font-style: italic; color: #c9a84c;
        }
        .footer-brand p {
          color: #a8c4b4;
          font-size: 14px;
          line-height: 1.8;
          margin: 0 0 20px 0;
        }

        /* Socials */
        .footer-socials {
          display: flex;
          gap: 12px;
        }
        .footer-socials a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
          color: #a8c4b4;
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .footer-socials a:hover {
          background: #c9a84c;
          color: #1a3d2e;
          border-color: #c9a84c;
          transform: translateY(-2px);
        }

        /* Sections */
        .footer-section h5 {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6a9e88;
          margin-bottom: 20px;
          font-family: 'Outfit', sans-serif;
        }
        .footer-section ul li {
          margin-bottom: 10px;
        }
        .footer-section ul li a {
          color: #a8c4b4;
          font-size: 14px;
          transition: color 0.2s, padding-left 0.2s;
          display: inline-block;
        }
        .footer-section ul li a:hover {
          color: #c9a84c;
          padding-left: 4px;
        }

        /* Hours */
        .footer-hours li {
          color: #a8c4b4;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
        }
        .footer-hours li span:last-child {
          color: #d4e8dc;
          font-weight: 500;
        }

        /* Contact */
        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .footer-contact-item svg {
          color: #c9a84c;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .footer-contact-item span {
          color: #d4e8dc;
          line-height: 1.5;
        }
        .footer-contact-item a {
          color: #d4e8dc;
          line-height: 1.5;
          transition: color 0.2s;
        }
        .footer-contact-item a:hover {
          color: #c9a84c;
        }

        /* Bottom */
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative; z-index: 1;
        }
        .footer-bottom p {
          color: #7aab90;
          font-size: 13px;
          margin: 0;
          font-weight: 500;
        }

        @media (max-width: 900px) {
          footer { padding: 48px 24px 28px; }
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
        }
      `}</style>

      <footer>
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <span className="f-logo">Clini<em>qo</em></span>
            <p>
              Your trusted healthcare partner across India. Quality care,
              compassionate doctors, and seamless appointment booking — all in one place.
            </p>
            {/* Socials */}
            <div className="footer-socials">
              <a href="https://www.linkedin.com/in/piyush-jha1134/" target="_blank" rel="noreferrer" title="LinkedIn">
                <FaLinkedin size={16} />
              </a>
              <a href="https://github.com/Piyush079-jha" target="_blank" rel="noreferrer" title="GitHub">
                <FaGithub size={16} />
              </a>
              <a href="https://www.instagram.com/piyush_jha39/" target="_blank" rel="noreferrer" title="Instagram">
                <FaInstagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h5>Quick Links</h5>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/appointment">Book Appointment</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/login">Patient Login</Link></li>
            </ul>
          </div>

          {/* Hours */}
          <div className="footer-section">
            <h5>Working Hours</h5>
            <ul className="footer-hours">
              {hours.map((h, i) => (
                <li key={i}>
                  <span>{h.day}</span>
                  <span>{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h5>Contact</h5>
            <div className="footer-contact-item">
              <FaPhone size={13} />
              <span>+91 96311 63498</span>
            </div>
            <div className="footer-contact-item">
              <FaEnvelope size={13} />
<a href="https://mail.google.com/mail/?view=cm&to=piyushjha1134@gmail.com" target="_blank" rel="noreferrer">piyushjha1134@gmail.com</a>
            </div>
            <div className="footer-contact-item">
              <FaMapMarkerAlt size={13} />
              <span>Bhubaneswar, Odisha, India</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Cliniqo. All rights reserved.</p>
          <p>Made with 🌿 in India</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
