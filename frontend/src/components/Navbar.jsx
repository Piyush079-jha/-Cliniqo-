import axios from "axios";
import React, { useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    current: false,
    newPw: false,
    confirm: false,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    admin,
    setAdmin,
  } = useContext(Context);

  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = isAdminAuthenticated ? admin : user;
  const displayName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim()
    : isAdminAuthenticated
      ? "Admin"
      : "Patient";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const roleLabel = isAdminAuthenticated ? "Admin" : "Patient";
  const isLoggedIn = isAuthenticated || isAdminAuthenticated;
  const avatarUrl = currentUser?.avatar?.url || null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openModal = async (type) => {
    setDropOpen(false);
    setModal(type);
    setAvatarPreview(null);
    setAvatarFile(null);
    setEditMode(false);
    if (type === "profile") {
      setProfileForm({
        firstName: currentUser?.firstName || "",
        lastName: currentUser?.lastName || "",
        phone: currentUser?.phone || "",
        gender: currentUser?.gender || "",
        dob: currentUser?.dob
          ? new Date(currentUser.dob).toISOString().split("T")[0]
          : "",
      });
    }
    if (type === "appointments") {
      setLoadingAppts(true);
      try {
        const res = await axios.get(
          "http://localhost:5000/api/v1/appointment/myappointments",
          { withCredentials: true },
        );
        setAppointments((res.data.appointments || []).reverse());
      } catch {
        setAppointments([]);
      } finally {
        setLoadingAppts(false);
      }
    }
  };

  const closeModal = () => {
    setModal(null);
    setPwForm({ current: "", newPw: "", confirm: "" });
    setAvatarPreview(null);
    setAvatarFile(null);
    setEditMode(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PNG, JPG, JPEG or WEBP allowed!");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3MB!");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const endpoint = isAdminAuthenticated
        ? "http://localhost:5000/api/v1/user/avatar/update/admin"
        : "http://localhost:5000/api/v1/user/avatar/update";
      const res = await axios.put(endpoint, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile picture updated!");
      const updatedAvatar = res.data.avatar;
      if (isAdminAuthenticated)
        setAdmin((prev) => ({ ...prev, avatar: updatedAvatar }));
      else setUser((prev) => ({ ...prev, avatar: updatedAvatar }));
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed!");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const endpoint = isAdminAuthenticated
        ? "http://localhost:5000/api/v1/user/profile/update/admin"
        : "http://localhost:5000/api/v1/user/profile/update";
      const res = await axios.put(endpoint, profileForm, {
        withCredentials: true,
      });
      toast.success("Profile updated successfully!");
      const updatedUser = res.data.user;
      if (isAdminAuthenticated)
        setAdmin((prev) => ({ ...prev, ...updatedUser }));
      else setUser((prev) => ({ ...prev, ...updatedUser }));
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile!");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      const endpoint = isAdminAuthenticated
        ? "http://localhost:5000/api/v1/user/admin/logout"
        : "http://localhost:5000/api/v1/user/patient/logout";
      const res = await axios.get(endpoint, { withCredentials: true });
      toast.success(res.data.message);
      setIsAuthenticated(false);
      if (isAdminAuthenticated) setIsAdminAuthenticated(false);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Passwords do not match!");
      return;
    }
    try {
      const endpoint = isAdminAuthenticated
        ? "http://localhost:5000/api/v1/user/password/update/admin"
        : "http://localhost:5000/api/v1/user/password/update";
      await axios.put(
        endpoint,
        {
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
          confirmPassword: pwForm.confirm,
        },
        { withCredentials: true },
      );
      toast.success("Password updated successfully!");
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
  };

  const isActive = (path) => location.pathname === path;
  const statusColor = (s) => {
    if (!s) return "#a0aec0";
    const sl = s.toLowerCase();
    if (sl === "accepted") return "#22c55e";
    if (sl === "rejected") return "#ef4444";
    if (sl === "pending") return "#f59e0b";
    return "#a0aec0";
  };

  return (
    <>
      <style>{`
        @keyframes goldPulse {
          0%,100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.06); }
        }
        @keyframes dropFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .nav-profile-wrap { position: relative; }
        .nav-profile-btn {
          position: relative; display: flex;
          align-items: center; justify-content: center;
          cursor: pointer; background: none; border: none; padding: 4px;
        }
        .nav-profile-ring {
          position: absolute; width: 44px; height: 44px;
          border-radius: 50%; border: 2px solid #c9a84c;
          animation: goldPulse 2.4s ease-in-out infinite;
          pointer-events: none;
        }
        .nav-profile-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #1a3d2e, #0f2a1e);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #c9a84c;
          font-family: 'Cormorant Garamond', serif;
          position: relative; z-index: 1;
          border: 1.5px solid rgba(201,168,76,0.3);
          transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
        }
        .nav-profile-avatar img {
          width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
        }
        .nav-profile-btn:hover .nav-profile-avatar { transform: scale(1.08); }

        /* Dropdown */
        .nav-profile-drop {
          position: absolute; top: calc(100% + 14px); right: 0;
          width: 240px; background: white;
          border-radius: 18px; border: 1px solid #e0ece5;
          box-shadow: 0 16px 48px rgba(26,61,46,0.16);
          padding: 6px; z-index: 1000;
          animation: dropFadeIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .nav-drop-header {
          padding: 14px 14px 12px;
          border-bottom: 1px solid #f0f5f2; margin-bottom: 6px;
          display: flex; align-items: center; gap: 12px;
        }
        .nav-drop-avatar-lg {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1a3d2e, #0f2a1e);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: #c9a84c;
          font-family: 'Cormorant Garamond', serif;
          border: 2px solid rgba(201,168,76,0.4);
          overflow: hidden;
        }
        .nav-drop-avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
        .nav-drop-info { min-width: 0; }
        .nav-drop-name {
          font-weight: 700; font-size: 14px; color: #0f2a1e;
          font-family: 'Outfit', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nav-drop-role {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 4px; background: #e8f0eb; border-radius: 999px;
          padding: 2px 9px; font-size: 10.5px; font-weight: 700;
          color: #1a3d2e; letter-spacing: 0.5px; text-transform: uppercase;
          font-family: 'Outfit', sans-serif;
        }
        .nav-drop-role-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; }
        .nav-drop-item {
          display: flex; align-items: center; gap: 11px;
          width: 100%; padding: 10px 14px;
          border: none; border-radius: 10px; background: none;
          cursor: pointer; font-size: 13.5px; font-weight: 500;
          color: #3a5446; font-family: 'Outfit', sans-serif;
          text-align: left; transition: background 0.15s, color 0.15s;
        }
        .nav-drop-item:hover { background: #f0f7f3; color: #1a3d2e; }
        .nav-drop-item .drop-icon { font-size: 16px; width: 20px; text-align: center; }
        .nav-drop-item .drop-arrow { margin-left: auto; font-size: 11px; color: #a0b8a8; transition: transform 0.15s; }
        .nav-drop-item:hover .drop-arrow { transform: translateX(3px); }
        .nav-drop-item.danger { color: #c0392b; }
        .nav-drop-item.danger:hover { background: #fef2f2; }
        .nav-drop-divider { height: 1px; background: #f0f5f2; margin: 4px 0; }

        /* Modal */
        .np-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(10,30,20,0.45); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .np-modal {
          background: white; border-radius: 24px;
          width: 100%; max-width: 480px;
          box-shadow: 0 24px 64px rgba(26,61,46,0.22);
          animation: modalIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
          overflow: hidden;
        }
        .np-modal-wide { max-width: 580px; }
        .np-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 18px; border-bottom: 1px solid #f0f5f2;
        }
        .np-modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: #0f2a1e; }
        .np-modal-title em { font-style: italic; color: #c9a84c; }
        .np-close-btn {
          width: 32px; height: 32px; border-radius: 50%;
          border: none; background: #f0f5f2; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #3a5446; transition: background 0.15s;
        }
        .np-close-btn:hover { background: #e0ece5; }
        .np-modal-body { padding: 22px 24px 24px; overflow-y: auto; max-height: 80vh; }

        /* Avatar upload section */
        .np-avatar-section {
          display: flex; flex-direction: column; align-items: center;
          gap: 14px; margin-bottom: 22px; padding-bottom: 22px;
          border-bottom: 1px solid #f0f5f2;
        }
        .np-avatar-ring {
          position: relative; width: 90px; height: 90px;
        }
        .np-avatar-ring::before {
          content: '';
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid #c9a84c;
          animation: goldPulse 2.4s ease-in-out infinite;
        }
        .np-avatar-img {
          width: 90px; height: 90px; border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(201,168,76,0.3);
        }
        .np-avatar-initials {
          width: 90px; height: 90px; border-radius: 50%;
          background: linear-gradient(135deg, #1a3d2e, #0f2a1e);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; font-weight: 700; color: #c9a84c;
          font-family: 'Cormorant Garamond', serif;
          border: 2px solid rgba(201,168,76,0.3);
        }
        .np-avatar-edit-btn {
          position: absolute; bottom: 2px; right: 2px;
          width: 26px; height: 26px; border-radius: 50%;
          background: #1a3d2e; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 12px;
          transition: background 0.15s;
        }
        .np-avatar-edit-btn:hover { background: #0f2a1e; }
        .np-avatar-actions { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .np-avatar-hint { font-size: 12px; color: #a0b8a8; font-family: 'Outfit', sans-serif; }
        .np-upload-btn {
          padding: 8px 20px;
          background: linear-gradient(135deg, #1a3d2e, #0f2a1e);
          color: white; border: none; border-radius: 999px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 3px 12px rgba(26,61,46,0.25);
          display: flex; align-items: center; gap: 7px;
        }
        .np-upload-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,61,46,0.32); }
        .np-upload-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .np-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          animation: spin 0.7s linear infinite;
        }
        .np-change-link {
          font-size: 12px; color: #7a9e8a; cursor: pointer;
          background: none; border: none; font-family: 'Outfit', sans-serif;
          text-decoration: underline; padding: 0;
        }
        .np-change-link:hover { color: #1a3d2e; }

        /* View/Edit toggle */
        .np-mode-toggle {
          display: flex; border-radius: 12px; overflow: hidden;
          border: 1px solid #e0ece5; margin-bottom: 18px;
        }
        .np-mode-tab {
          flex: 1; padding: 9px;
          border: none; background: none; cursor: pointer;
          font-size: 12.5px; font-weight: 600;
          font-family: 'Outfit', sans-serif; color: #7a9e8a;
          transition: background 0.15s, color 0.15s;
        }
        .np-mode-tab.active { background: #1a3d2e; color: white; }

        /* Profile grid */
        .np-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .np-profile-field { display: flex; flex-direction: column; gap: 4px; }
        .np-profile-field label {
          font-size: 10.5px; font-weight: 700; color: #7a9e8a;
          letter-spacing: 0.6px; text-transform: uppercase; font-family: 'Outfit', sans-serif;
        }
        .np-profile-field span {
          font-size: 14.5px; font-weight: 600; color: #0f2a1e;
          font-family: 'Outfit', sans-serif;
          padding: 9px 13px; background: #f5f9f6;
          border-radius: 9px; border: 1px solid #e0ece5;
        }
        .np-profile-field.full { grid-column: 1 / -1; }

        /* Edit form */
        .np-edit-form { display: flex; flex-direction: column; gap: 14px; }
        .np-edit-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .np-edit-field { display: flex; flex-direction: column; gap: 5px; }
        .np-edit-field.full { grid-column: 1 / -1; }
        .np-edit-field label {
          font-size: 10.5px; font-weight: 700; color: #7a9e8a;
          letter-spacing: 0.6px; text-transform: uppercase; font-family: 'Outfit', sans-serif;
        }
        .np-edit-field input,
        .np-edit-field select {
          padding: 10px 13px;
          border: 1.5px solid #c4d9ca; border-radius: 10px;
          font-size: 14px; font-family: 'Outfit', sans-serif;
          color: #0b2a1c; background: white; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .np-edit-field input:focus,
        .np-edit-field select:focus {
          border-color: #1a3d2e; box-shadow: 0 0 0 3px rgba(26,61,46,0.1);
        }
        .np-edit-actions { display: flex; gap: 10px; margin-top: 4px; }
        .np-save-btn {
          flex: 1; padding: 12px;
          background: linear-gradient(135deg, #1a3d2e, #0f2a1e);
          color: white; border: none; border-radius: 999px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(26,61,46,0.28);
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .np-save-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(26,61,46,0.36); }
        .np-save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .np-cancel-btn {
          padding: 12px 20px;
          background: #f0f5f2; color: #3a5446;
          border: none; border-radius: 999px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: background 0.15s;
        }
        .np-cancel-btn:hover { background: #e0ece5; }

        /* Appointments */
        .np-appt-list { display: flex; flex-direction: column; gap: 10px; max-height: 360px; overflow-y: auto; }
        .np-appt-list::-webkit-scrollbar { width: 4px; }
        .np-appt-list::-webkit-scrollbar-thumb { background: #c8dcd0; border-radius: 4px; }
        .np-appt-card {
          border: 1px solid #e0ece5; border-radius: 12px;
          padding: 13px 15px; background: #fafcfb;
          display: flex; align-items: flex-start; gap: 12px;
        }
        .np-appt-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #1a3d2e, #0f2a1e);
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .np-appt-info { flex: 1; min-width: 0; }
        .np-appt-doctor { font-size: 14px; font-weight: 700; color: #0f2a1e; font-family: 'Outfit', sans-serif; }
        .np-appt-dept { font-size: 12px; color: #7a9e8a; margin-top: 2px; font-family: 'Outfit', sans-serif; }
        .np-appt-date { font-size: 11.5px; color: #486057; margin-top: 5px; font-family: 'Outfit', sans-serif; }
        .np-appt-status {
          font-size: 11px; font-weight: 700; padding: 3px 9px;
          border-radius: 999px; text-transform: capitalize;
          font-family: 'Outfit', sans-serif; flex-shrink: 0; margin-top: 2px;
        }
        .np-empty { text-align: center; padding: 32px 0; color: #a0b8a8; font-size: 14px; font-family: 'Outfit', sans-serif; }
        .np-empty-icon { font-size: 36px; margin-bottom: 10px; }

        /* Password */
        .np-pw-field { margin-bottom: 16px; }
        .np-pw-field label {
          display: block; font-size: 11px; font-weight: 700;
          color: #486057; margin-bottom: 7px;
          letter-spacing: 0.6px; text-transform: uppercase; font-family: 'Outfit', sans-serif;
        }
        .np-pw-input-wrap { position: relative; }
        .np-pw-input-wrap input {
          width: 100%; padding: 11px 42px 11px 14px;
          border: 1.5px solid #c4d9ca; border-radius: 10px;
          font-size: 14px; font-family: 'Outfit', sans-serif;
          color: #0b2a1c; background: white; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .np-pw-input-wrap input:focus { border-color: #1a3d2e; box-shadow: 0 0 0 3px rgba(26,61,46,0.1); }
        .np-pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 16px; color: #7a9e8a; transition: color 0.15s;
        }
        .np-pw-toggle:hover { color: #1a3d2e; }
        .np-pw-submit {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #1a3d2e, #0f2a1e);
          color: white; border: none; border-radius: 999px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Outfit', sans-serif; margin-top: 6px;
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s;
          box-shadow: 0 4px 18px rgba(26,61,46,0.28);
        }
        .np-pw-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(26,61,46,0.36); }
        .np-loading { text-align: center; padding: 28px; color: #7a9e8a; font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* ── Navbar ── */}
      <nav className={scrolled ? "scrolled" : ""}>
        <Link to="/" className="nav-logo">
          <span style={{ fontStyle: "italic", color: "var(--primary-dark)" }}>
            Clini
          </span>
          <span style={{ color: "var(--gold)", fontWeight: 800 }}>qo</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={isActive("/") ? "nav-link-active" : ""}>
            Home
          </Link>
          <Link
            to="/doctors"
            className={isActive("/doctors") ? "nav-link-active" : ""}
          >
            Doctors
          </Link>
          <Link
            to="/departments"
            className={isActive("/departments") ? "nav-link-active" : ""}
          >
            Departments
          </Link>
          <Link
            to="/appointment"
            className={isActive("/appointment") ? "nav-link-active" : ""}
          >
            Book Appointment
          </Link>
          <Link
            to="/about"
            className={isActive("/about") ? "nav-link-active" : ""}
          >
            About Us
          </Link>
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <div className="nav-profile-wrap" ref={dropRef}>
              <button
                className="nav-profile-btn"
                onClick={() => setDropOpen((p) => !p)}
                aria-label="Profile menu"
              >
                <span className="nav-profile-ring" />
                <span className="nav-profile-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : initials}
                </span>
              </button>

              {dropOpen && (
                <div className="nav-profile-drop">
                  <div className="nav-drop-header">
                    <div className="nav-drop-avatar-lg">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="nav-drop-info">
                      <div className="nav-drop-name">{displayName}</div>
                      <div className="nav-drop-role">
                        <span className="nav-drop-role-dot" />
                        {roleLabel}
                      </div>
                    </div>
                  </div>

                  <button
                    className="nav-drop-item"
                    onClick={() => openModal("profile")}
                  >
                    <span className="drop-icon">👤</span> View Profile{" "}
                    <span className="drop-arrow">›</span>
                  </button>
                  {/* <button className="nav-drop-item" onClick={() => openModal("appointments")}>
                    <span className="drop-icon">📅</span> My Appointments <span className="drop-arrow">›</span>
                  </button>
                  <button className="nav-drop-item" onClick={() => openModal("password")}> */}
                  {/* <button
                    className="nav-drop-item"
                    onClick={() => openModal("appointments")}
                  >
                    <span className="drop-icon">📅</span> My Appointments{" "}
                    <span className="drop-arrow">›</span>
                  </button> */}
                  {isAuthenticated && !isAdminAuthenticated && (
                    <button
                      className="nav-drop-item"
                      onClick={() => {
                        setDropOpen(false);
                        navigate("/patient/dashboard");
                      }}
                    >
                      <span className="drop-icon">🏥</span> My Dashboard{" "}
                      <span className="drop-arrow">›</span>
                    </button>
                  )}
                  <button
                    className="nav-drop-item"
                    onClick={() => openModal("password")}
                  >
                    <span className="drop-icon">🔑</span> Change Password{" "}
                    <span className="drop-arrow">›</span>
                  </button>

                  {isAdminAuthenticated && (
                    <>
                      <div className="nav-drop-divider" />
                      <button
                        className="nav-drop-item"
                        onClick={() => navigate("/admin/dashboard")}
                      >
                        <span className="drop-icon">🛡️</span> Dashboard{" "}
                        <span className="drop-arrow">›</span>
                      </button>
                    </>
                  )}
                  <div className="nav-drop-divider" />
                  <button
                    className="nav-drop-item danger"
                    onClick={handleLogout}
                  >
                    <span className="drop-icon">🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                className="btn-outline"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/appointment")}
              >
                Appointment →
              </button>
            </>
          )}
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <IoClose /> : <GiHamburgerMenu />}
        </button>
      </nav>

      {/* ── Mobile menu ── */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>
          Home
        </Link>
        <Link to="/doctors" onClick={() => setMenuOpen(false)}>
          Doctors
        </Link>
        <Link to="/departments" onClick={() => setMenuOpen(false)}>
          Departments
        </Link>
        <Link to="/appointment" onClick={() => setMenuOpen(false)}>
          Book Appointment
        </Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>
          About Us
        </Link>
        {isLoggedIn ? (
          <>
            <div
              style={{
                padding: "10px 16px",
                fontSize: 14,
                color: "#3a5446",
                fontWeight: 600,
              }}
            >
              👤 {displayName} ·{" "}
              <span style={{ color: "#c9a84c" }}>{roleLabel}</span>
            </div>
            <button
              className="btn-outline"
              onClick={() => {
                openModal("profile");
                setMenuOpen(false);
              }}
            >
              View Profile
            </button>
        
            {/* <button
              className="btn-outline"
              onClick={() => {
                openModal("appointments");
                setMenuOpen(false);
              }}
            >
              My Appointments
            </button> */}
            {isAuthenticated && !isAdminAuthenticated && (
              <button
                className="btn-outline"
                onClick={() => {
                  navigate("/patient/dashboard");
                  setMenuOpen(false);
                }}
              >
                My Dashboard
              </button>
            )}
            <button
              className="btn-outline"
              onClick={() => {
                openModal("password");
                setMenuOpen(false);
              }}
            >
              Change Password
            </button>
            {isAdminAuthenticated && (
              <button
                className="btn-outline"
                onClick={() => {
                  navigate("/admin/dashboard");
                  setMenuOpen(false);
                }}
              >
                Dashboard
              </button>
            )}
            <button className="btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-outline"
              onClick={() => {
                navigate("/login");
                setMenuOpen(false);
              }}
            >
              Sign In
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                navigate("/appointment");
                setMenuOpen(false);
              }}
            >
              Appointment →
            </button>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div
          className="np-overlay"
          onClick={(e) =>
            e.target.classList.contains("np-overlay") && closeModal()
          }
        >
          {/* VIEW PROFILE + EDIT */}
          {modal === "profile" && (
            <div className="np-modal">
              <div className="np-modal-head">
                <div className="np-modal-title">
                  My <em>Profile</em>
                </div>
                <button className="np-close-btn" onClick={closeModal}>
                  <IoClose />
                </button>
              </div>
              <div className="np-modal-body">
                <div className="np-avatar-section">
                  <div className="np-avatar-ring">
                    {avatarPreview || avatarUrl ? (
                      <img
                        className="np-avatar-img"
                        src={avatarPreview || avatarUrl}
                        alt="avatar"
                      />
                    ) : (
                      <div className="np-avatar-initials">{initials}</div>
                    )}
                    <button
                      className="np-avatar-edit-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Change photo"
                    >
                      📷
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                  <div className="np-avatar-actions">
                    {avatarPreview ? (
                      <>
                        <button
                          className="np-upload-btn"
                          onClick={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? (
                            <>
                              <span className="np-spinner" /> Uploading…
                            </>
                          ) : (
                            "✓ Save Photo"
                          )}
                        </button>
                        <button
                          className="np-change-link"
                          onClick={() => {
                            setAvatarPreview(null);
                            setAvatarFile(null);
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="np-upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📷 {avatarUrl ? "Change Photo" : "Upload Photo"}
                        </button>
                        <span className="np-avatar-hint">
                          PNG, JPG or WEBP · Max 3MB
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="np-mode-toggle">
                  <button
                    className={`np-mode-tab ${!editMode ? "active" : ""}`}
                    onClick={() => setEditMode(false)}
                  >
                    👁 View
                  </button>
                  <button
                    className={`np-mode-tab ${editMode ? "active" : ""}`}
                    onClick={() => setEditMode(true)}
                  >
                    ✏️ Edit
                  </button>
                </div>

                {!editMode && (
                  <div className="np-profile-grid">
                    <div className="np-profile-field">
                      <label>First Name</label>
                      <span>{currentUser?.firstName || "—"}</span>
                    </div>
                    <div className="np-profile-field">
                      <label>Last Name</label>
                      <span>{currentUser?.lastName || "—"}</span>
                    </div>
                    <div className="np-profile-field full">
                      <label>Email Address</label>
                      <span>{currentUser?.email || "—"}</span>
                    </div>
                    <div className="np-profile-field">
                      <label>Phone</label>
                      <span>{currentUser?.phone || "—"}</span>
                    </div>
                    <div className="np-profile-field">
                      <label>Gender</label>
                      <span>{currentUser?.gender || "—"}</span>
                    </div>
                    <div className="np-profile-field">
                      <label>Date of Birth</label>
                      <span>
                        {currentUser?.dob
                          ? new Date(currentUser.dob).toLocaleDateString(
                              "en-IN",
                            )
                          : "—"}
                      </span>
                    </div>
                    <div className="np-profile-field">
                      <label>Role</label>
                      <span>{currentUser?.role || roleLabel}</span>
                    </div>
                  </div>
                )}

                {editMode && (
                  <form className="np-edit-form" onSubmit={handleProfileUpdate}>
                    <div className="np-edit-row">
                      <div className="np-edit-field">
                        <label>First Name</label>
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              firstName: e.target.value,
                            }))
                          }
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div className="np-edit-field">
                        <label>Last Name</label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              lastName: e.target.value,
                            }))
                          }
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>
                    <div className="np-edit-row">
                      <div className="np-edit-field">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="Phone number"
                          required
                        />
                      </div>
                      <div className="np-edit-field">
                        <label>Gender</label>
                        <select
                          value={profileForm.gender}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              gender: e.target.value,
                            }))
                          }
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="np-edit-field full">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, dob: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="np-edit-actions">
                      <button
                        type="button"
                        className="np-cancel-btn"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="np-save-btn"
                        disabled={savingProfile}
                      >
                        {savingProfile ? (
                          <>
                            <span className="np-spinner" /> Saving…
                          </>
                        ) : (
                          "✓ Save Changes"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* MY APPOINTMENTS */}
          {modal === "appointments" && (
            <div className="np-modal np-modal-wide">
              <div className="np-modal-head">
                <div className="np-modal-title">
                  My <em>Appointments</em>
                </div>
                <button className="np-close-btn" onClick={closeModal}>
                  <IoClose />
                </button>
              </div>
              <div className="np-modal-body">
                {loadingAppts ? (
                  <div className="np-loading">Loading appointments…</div>
                ) : appointments.length === 0 ? (
                  <div className="np-empty">
                    <div className="np-empty-icon">📭</div>
                    No appointments found
                  </div>
                ) : (
                  <div className="np-appt-list">
                    {appointments.map((appt, i) => (
                      <div key={i} className="np-appt-card">
                        <div className="np-appt-icon">🩺</div>
                        <div className="np-appt-info">
                          <div className="np-appt-doctor">
                            Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                          </div>
                          <div className="np-appt-dept">
                            {appt.department || appt.doctor?.doctorDepartment}
                          </div>
                          <div className="np-appt-date">
                            📅{" "}
                            {appt.appointment_date
                              ? new Date(
                                  appt.appointment_date,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </div>
                        </div>
                        <span
                          className="np-appt-status"
                          style={{
                            background: `${statusColor(appt.status)}18`,
                            color: statusColor(appt.status),
                            border: `1px solid ${statusColor(appt.status)}40`,
                          }}
                        >
                          {appt.status || "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHANGE PASSWORD */}
          {modal === "password" && (
            <div className="np-modal">
              <div className="np-modal-head">
                <div className="np-modal-title">
                  Change <em>Password</em>
                </div>
                <button className="np-close-btn" onClick={closeModal}>
                  <IoClose />
                </button>
              </div>
              <div className="np-modal-body">
                <form onSubmit={handlePasswordChange}>
                  {[
                    {
                      key: "current",
                      label: "Current Password",
                      placeholder: "Enter current password",
                    },
                    {
                      key: "newPw",
                      label: "New Password",
                      placeholder: "Min 8 characters",
                    },
                    {
                      key: "confirm",
                      label: "Confirm New Password",
                      placeholder: "Re-enter new password",
                    },
                  ].map(({ key, label, placeholder }) => (
                    <div className="np-pw-field" key={key}>
                      <label>{label}</label>
                      <div className="np-pw-input-wrap">
                        <input
                          type={showPw[key] ? "text" : "password"}
                          value={pwForm[key]}
                          onChange={(e) =>
                            setPwForm((p) => ({ ...p, [key]: e.target.value }))
                          }
                          placeholder={placeholder}
                          required
                        />
                        <button
                          type="button"
                          className="np-pw-toggle"
                          onClick={() =>
                            setShowPw((p) => ({ ...p, [key]: !p[key] }))
                          }
                        >
                          {showPw[key] ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="submit" className="np-pw-submit">
                    Update Password →
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
