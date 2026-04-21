import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
// import SlotPicker from "./SlotPicker";
import { Context } from "../main";
import SlotPicker from "./DocSlotPicker";
const departments = [
  { name: "Pediatrics", emoji: "👶" },
  { name: "Orthopedics", emoji: "🦴" },
  { name: "Cardiology", emoji: "❤️" },
  { name: "Neurology", emoji: "🧠" },
  { name: "Oncology", emoji: "🎗️" },
  { name: "Radiology", emoji: "🔬" },
  { name: "Physical Therapy", emoji: "🏃" },
  { name: "Dermatology", emoji: "✨" },
  { name: "ENT", emoji: "👂" },
];

const calculateAge = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : "";
};

const getDoctorAvatar = (doctor) => {
  const name = `${doctor.firstName}+${doctor.lastName}`;
  const bg = doctor.gender === "Female" ? "c026d3" : "1a3d2e";
  return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=64&bold=true`;
};

// const AppointmentForm = () => {
//   const [searchParams] = useSearchParams();
//   const [form, setForm] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     dob: "",
//     age: "",
//     gender: "",
//     appointment_date: "",
//     department: "",
//     doctor_firstName: "",
//     doctor_lastName: "",
//     address: "",
//     hasVisited: false,
//   });

const AppointmentForm = () => {
  const [searchParams] = useSearchParams();
  const { user } = useContext(Context);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    age: "",
    gender: "",
    appointment_date: "",
    department: "",
    doctor_firstName: "",
    doctor_lastName: "",
    address: "",
    hasVisited: false,
  });
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [heroVis, setHeroVis] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVis(true), 80);
    axios
      .get("http://localhost:5000/api/v1/user/doctors", {
        withCredentials: true,
      })
      .then(({ data }) => {
        const allDoctors = data.doctors || [];
        setDoctors(allDoctors);
        const dept = searchParams.get("department") || "";
        const firstName = searchParams.get("doctor_firstName") || "";
        const lastName = searchParams.get("doctor_lastName") || "";
        if (dept) {
          setForm((prev) => ({
            ...prev,
            department: dept,
            doctor_firstName: firstName,
            doctor_lastName: lastName,
          }));
          if (firstName && lastName) {
            setSelectedDoctor(`${firstName}|||${lastName}`);
            const doc = allDoctors.find(
              (d) => d.firstName === firstName && d.lastName === lastName,
            );
            if (doc) setSelectedDoctorId(doc._id);
          }
        }
      })
      .catch(() => {});
  }, []);
// ✅ Auto-fill personal info from logged-in user profile
useEffect(() => {
  if (user && user.firstName) {
    setForm((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName:  user.lastName  || "",
      email:     user.email     || "",
      phone:     user.phone     || "",
      gender:    user.gender    || "",
      dob:       user.dob
        ? new Date(user.dob).toISOString().split("T")[0]
        : "",
      age: user.dob
        ? calculateAge(new Date(user.dob).toISOString().split("T")[0]).toString()
        : "",
    }));
  }
}, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    if (name === "dob") {
      setForm((prev) => ({
        ...prev,
        dob: value,
        age: calculateAge(value).toString(),
      }));
      return;
    }
    if (name === "department") {
      setSelectedDoctor("");
      setSelectedDoctorId("");
      setSelectedSlot("");
      setForm((prev) => ({
        ...prev,
        department: val,
        doctor_firstName: "",
        doctor_lastName: "",
      }));
      return;
    }
    // Reset slot when date changes
    if (name === "appointment_date") {
      setSelectedSlot("");
    }
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleDoctorSelect = (doctor) => {
    const key = `${doctor.firstName}|||${doctor.lastName}`;
    setSelectedDoctor(key);
    setSelectedDoctorId(doctor._id);
    setSelectedSlot("");
    setForm((prev) => ({
      ...prev,
      doctor_firstName: doctor.firstName,
      doctor_lastName: doctor.lastName,
    }));
  };

  const filteredDoctors = doctors.filter(
    (d) => d.doctorDepartment === form.department,
  );
  const step1Valid =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.phone &&
    form.dob &&
    form.gender &&
    form.address;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor_firstName || !form.doctor_lastName) {
      toast.error("Please select a doctor");
      return;
    }
    if (form.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/v1/appointment/post",
        {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          dob: form.dob,
          gender: form.gender,
          appointment_date: form.appointment_date,
          appointment_time: selectedSlot || null,
          department: form.department,
          doctor_firstName: form.doctor_firstName,
          doctor_lastName: form.doctor_lastName,
          hasVisited: form.hasVisited,
          address: form.address,
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      toast.success(res.data.message);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dob: "",
        age: "",
        gender: "",
        appointment_date: "",
        department: "",
        doctor_firstName: "",
        doctor_lastName: "",
        address: "",
        hasVisited: false,
      });
      setSelectedDoctor("");
      setSelectedDoctorId("");
      setSelectedSlot("");
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedDeptMeta = departments.find((d) => d.name === form.department);
  const selectedDoctorObj = doctors.find(
    (d) =>
      d.firstName === form.doctor_firstName &&
      d.lastName === form.doctor_lastName,
  );

  return (
    <>
      <style>{`
        @keyframes heroSlide { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes stepLine  { from{width:0} to{width:100%} }

        .appt-hero {
          background: #0d2818;
          padding: 80px 80px 64px;
          position: relative; overflow: hidden;
        }
        .appt-hero::before {
          content:''; position:absolute; inset:0;
          background-image: linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
          background-size: 48px 48px;
        }
        .appt-hero::after {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background: linear-gradient(90deg,transparent,#c9a84c,#e8cc80,#c9a84c,transparent);
        }
        .appt-hero-orb {
          position:absolute; border-radius:50%; filter:blur(80px);
          pointer-events:none; animation:pulse 7s ease-in-out infinite;
        }
        .appt-hero-orb-1 { width:400px;height:400px;top:-120px;right:-60px;background:rgba(201,168,76,.1); }
        .appt-hero-orb-2 { width:280px;height:280px;bottom:-80px;left:10%;background:rgba(34,197,94,.07);animation-delay:3s; }
        .appt-hero-inner {
          position:relative; z-index:1;
          max-width:1100px; margin:0 auto;
          display:flex; align-items:center; justify-content:space-between; gap:48px;
        }
        .appt-hero-left { opacity:0; }
        .appt-hero-left.vis { animation: heroSlide .85s cubic-bezier(.22,1,.36,1) forwards; }
        .appt-hero-tag {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(201,168,76,.12); border:1px solid rgba(201,168,76,.3);
          color:#c9a84c; padding:5px 14px; border-radius:999px;
          font-size:11px; font-weight:800; letter-spacing:1.5px;
          text-transform:uppercase; margin-bottom:18px;
        }
        .appt-hero-tag-dot { width:6px;height:6px;border-radius:50%;background:#c9a84c;animation:pulse 2s infinite; }
        .appt-hero-left h1 {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(30px,4vw,48px); color:white;
          font-weight:700; line-height:1.1; margin:0 0 14px;
        }
        .appt-hero-left h1 em { font-style:italic; color:#c9a84c; }
        .appt-hero-left p { color:#7aab90; font-size:15px; line-height:1.75; max-width:420px; margin:0; }
        .appt-hero-right { display:flex; flex-direction:column; gap:12px; opacity:0; }
        .appt-hero-right.vis { animation: heroSlide .85s .12s cubic-bezier(.22,1,.36,1) forwards; }
        .appt-info-pill {
          display:flex; align-items:center; gap:12px;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
          border-radius:14px; padding:14px 18px; min-width:220px;
          transition:background .2s,border-color .2s;
        }
        .appt-info-pill:hover { background:rgba(255,255,255,.1); border-color:rgba(201,168,76,.3); }
        .appt-info-pill-icon { font-size:22px; flex-shrink:0; }
        .appt-info-pill-text strong { display:block; font-size:14px; font-weight:700; color:white; }
        .appt-info-pill-text span   { font-size:12px; color:rgba(255,255,255,.5); }

        .appt-body { background: var(--bg-alt); padding: 56px 80px 80px; }
        .appt-layout {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;
        }

        .appt-steps { display:flex; align-items:center; gap:0; margin-bottom:32px; }
        .appt-step { display:flex; align-items:center; gap:10px; cursor:pointer; }
        .appt-step-circle {
          width:36px; height:36px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; transition:all .25s;
          border:2px solid var(--border);
          background:var(--bg-card); color:var(--text-gray);
        }
        .appt-step.active .appt-step-circle,
        .appt-step.done .appt-step-circle { background:#1a3d2e; border-color:#1a3d2e; color:white; }
        .appt-step-label { font-size:13px; font-weight:700; color:var(--text-gray); transition:color .25s; }
        .appt-step.active .appt-step-label,
        .appt-step.done .appt-step-label { color:#1a3d2e; }
        .appt-step-line {
          flex:1; height:2px; background:var(--border);
          margin:0 12px; border-radius:999px; overflow:hidden; position:relative;
        }
        .appt-step-line.done::after {
          content:''; position:absolute; inset:0;
          background:#1a3d2e; animation:stepLine .4s ease forwards;
        }

        .appt-form-card {
          background:var(--bg-card); border-radius:20px;
          border:1.5px solid var(--border); overflow:hidden;
          box-shadow:0 4px 24px rgba(0,0,0,.06); animation:fadeUp .4s ease;
        }
        .appt-form-header {
          padding:20px 28px; border-bottom:1px solid var(--border);
          display:flex; align-items:center; gap:12px;
          background:linear-gradient(135deg,rgba(26,61,46,.04),transparent);
        }
        .appt-form-header-icon {
          width:40px; height:40px; border-radius:12px;
          background:rgba(26,61,46,.1); border:1px solid rgba(26,61,46,.15);
          display:flex; align-items:center; justify-content:center; font-size:20px;
        }
        .appt-form-header h3 { font-size:16px; font-weight:800; color:var(--text-dark); font-family:"Outfit",sans-serif; margin:0 0 2px; }
        .appt-form-header p  { font-size:12px; color:var(--text-gray); margin:0; }
        .appt-form-body { padding:28px; }

        .apf-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
        .apf-row-single { margin-bottom:20px; }
        .apf-group label {
          display:block; font-size:12px; font-weight:700;
          color:var(--text-gray); margin-bottom:7px;
          text-transform:uppercase; letter-spacing:.6px;
        }
        .apf-group input,
        .apf-group select {
          width:100%; padding:11px 14px; border-radius:11px;
          border:1.5px solid var(--border);
          background:var(--bg-alt); color:var(--text-dark);
          font-size:14px; font-family:"Outfit",sans-serif;
          outline:none; transition:border-color .2s,box-shadow .2s;
          box-sizing:border-box;
        }
        .apf-group input:focus,
        .apf-group select:focus { border-color:#1a3d2e; box-shadow:0 0 0 3px rgba(26,61,46,.1); }
        .apf-group input::placeholder { color:var(--text-light); }
        .apf-group input[readonly] { background:var(--bg-alt); cursor:default; color:#1a3d2e; font-weight:700; }

        .apf-age-wrap { display:flex; align-items:center; gap:10px; }
        .apf-age-badge {
          display:inline-flex; align-items:center; gap:5px;
          padding:6px 14px; border-radius:999px;
          background:rgba(26,61,46,.08); color:#1a3d2e;
          font-size:13px; font-weight:800; border:1px solid rgba(26,61,46,.15); white-space:nowrap;
        }

        .apf-divider { display:flex; align-items:center; gap:12px; margin:8px 0 24px; }
        .apf-divider-line { flex:1; height:1px; background:var(--border); }
        .apf-divider-label { font-size:11px; font-weight:800; color:var(--text-gray); letter-spacing:1px; text-transform:uppercase; white-space:nowrap; }

        .apf-dept-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:4px; }
        .apf-dept-btn {
          padding:12px 8px; border-radius:12px; border:1.5px solid var(--border);
          background:var(--bg-alt); display:flex; flex-direction:column; align-items:center; gap:5px;
          cursor:pointer; transition:all .2s; text-align:center;
        }
        .apf-dept-btn:hover { border-color:#1a3d2e; background:rgba(26,61,46,.05); }
        .apf-dept-btn.selected { border-color:#1a3d2e; background:rgba(26,61,46,.08); box-shadow:0 0 0 3px rgba(26,61,46,.08); }
        .apf-dept-emoji { font-size:22px; line-height:1; }
        .apf-dept-name  { font-size:11px; font-weight:700; color:var(--text-dark); line-height:1.2; }

        .apf-doctor-grid { display:flex; flex-direction:column; gap:10px; }
        .apf-doctor-card {
          display:flex; align-items:center; gap:14px;
          padding:12px 16px; border-radius:14px;
          border:1.5px solid var(--border); background:var(--bg-alt);
          cursor:pointer; transition:all .22s;
        }
        .apf-doctor-card:hover { border-color:#1a3d2e; background:rgba(26,61,46,.04); transform:translateX(3px); }
        .apf-doctor-card.selected { border-color:#1a3d2e; background:rgba(26,61,46,.08); box-shadow:0 0 0 3px rgba(26,61,46,.08); }
        .apf-doctor-img { width:44px; height:44px; border-radius:50%; border:2px solid white; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,.12); flex-shrink:0; }
        .apf-doctor-info { flex:1; }
        .apf-doctor-name { font-size:14px; font-weight:800; color:var(--text-dark); margin-bottom:2px; }
        .apf-doctor-dept { font-size:12px; color:var(--text-gray); }
        .apf-doctor-check {
          width:22px; height:22px; border-radius:50%; border:2px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; transition:all .2s; flex-shrink:0;
        }
        .apf-doctor-card.selected .apf-doctor-check { background:#1a3d2e; border-color:#1a3d2e; color:white; }

        .apf-no-doctors {
          display:flex; align-items:center; gap:12px; padding:16px;
          background:#fffbeb; border-radius:12px; border:1px solid #fde68a;
        }
        .apf-no-doctors span { font-size:20px; }
        .apf-no-doctors strong { display:block; font-size:13px; color:#92650a; margin-bottom:2px; }
        .apf-no-doctors p { font-size:12px; color:#b07d2a; margin:0; }

        /* ✅ Slot section wrapper */
        .apf-slot-section {
          margin: 8px 0 24px;
          padding: 16px;
          background: var(--bg-alt);
          border: 1.5px solid var(--border);
          border-radius: 14px;
        }

        .apf-checkbox {
          display:flex; align-items:center; gap:10px; padding:14px 16px; border-radius:12px;
          background:var(--bg-alt); border:1.5px solid var(--border); cursor:pointer;
          transition:border-color .2s; margin-bottom:24px;
        }
        .apf-checkbox:hover { border-color:#1a3d2e; }
        .apf-checkbox input { width:16px;height:16px;cursor:pointer;accent-color:#1a3d2e; }
        .apf-checkbox label { font-size:13px; font-weight:600; color:var(--text-dark); cursor:pointer; }

        .apf-nav { display:flex; gap:12px; justify-content:space-between; align-items:center; margin-top:8px; }
        .apf-back-btn {
          padding:12px 24px; border-radius:12px; border:1.5px solid var(--border);
          background:transparent; color:var(--text-gray); font-size:14px; font-weight:700;
          cursor:pointer; font-family:"Outfit",sans-serif; transition:all .2s;
          display:flex; align-items:center; gap:6px;
        }
        .apf-back-btn:hover { background:var(--bg-alt); color:var(--text-dark); }
        .apf-next-btn {
          padding:13px 32px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#1a3d2e,#2d6a4f); color:white;
          font-size:14px; font-weight:800; cursor:pointer; font-family:"Outfit",sans-serif;
          transition:transform .2s,box-shadow .2s,opacity .2s;
          box-shadow:0 4px 16px rgba(26,61,46,.3);
          display:flex; align-items:center; gap:8px; flex:1; justify-content:center;
        }
        .apf-next-btn:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 8px 24px rgba(26,61,46,.4); }
        .apf-next-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .apf-spinner { display:inline-block; width:15px;height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }

        .appt-sidebar { display:flex; flex-direction:column; gap:20px; }
        .appt-summary { background:var(--bg-card); border-radius:20px; border:1.5px solid var(--border); overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.06); animation:fadeUp .4s .1s ease both; }
        .appt-summary-header { padding:16px 20px; background:#1a3d2e; display:flex; align-items:center; gap:10px; }
        .appt-summary-header h4 { font-size:14px; font-weight:800; color:white; font-family:"Outfit",sans-serif; margin:0; }
        .appt-summary-body { padding:20px; display:flex; flex-direction:column; gap:14px; }
        .appt-summary-row { display:flex; align-items:flex-start; gap:12px; }
        .appt-summary-icon { width:32px; height:32px; border-radius:8px; background:rgba(26,61,46,.08); border:1px solid rgba(26,61,46,.1); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
        .appt-summary-info strong { display:block; font-size:12px; color:var(--text-gray); font-weight:600; margin-bottom:2px; }
        .appt-summary-info span   { display:block; font-size:14px; font-weight:800; color:var(--text-dark); }
        .appt-summary-info span.empty { color:var(--text-light); font-weight:400; font-style:italic; font-size:13px; }

        .appt-doctor-preview { background:var(--bg-card); border-radius:20px; border:1.5px solid var(--border); padding:20px; animation:fadeUp .4s .18s ease both; display:flex; flex-direction:column; gap:14px; }
        .adp-header { display:flex; align-items:center; gap:12px; }
        .adp-img { width:52px; height:52px; border-radius:50%; border:2px solid white; box-shadow:0 4px 12px rgba(0,0,0,.12); object-fit:cover; }
        .adp-name { font-size:15px; font-weight:800; color:var(--text-dark); margin-bottom:2px; }
        .adp-dept { font-size:12px; color:var(--text-gray); }
        .adp-stats { display:grid; grid-template-columns:repeat(3,1fr); background:var(--bg-alt); border-radius:12px; border:1px solid var(--border); overflow:hidden; }
        .adp-stat { padding:10px 8px; text-align:center; border-right:1px solid var(--border); }
        .adp-stat:last-child { border-right:none; }
        .adp-stat strong { display:block; font-size:13px; font-weight:800; color:var(--text-dark); }
        .adp-stat span   { font-size:10px; color:var(--text-gray); font-weight:500; }

        .appt-tips { background:linear-gradient(135deg,#0d2818,#1a3d2e); border-radius:20px; padding:20px; animation:fadeUp .4s .24s ease both; }
        .appt-tips h4 { font-size:13px; font-weight:800; color:rgba(255,255,255,.9); margin:0 0 14px; display:flex; align-items:center; gap:8px; }
        .appt-tips ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
        .appt-tips li { font-size:12px; color:rgba(255,255,255,.65); display:flex; align-items:flex-start; gap:8px; line-height:1.5; }
        .appt-tips li::before { content:"→"; color:#c9a84c; flex-shrink:0; font-weight:700; }

        @media(max-width:1024px){
          .appt-hero { padding:72px 40px 56px; }
          .appt-body { padding:40px 40px 64px; }
          .appt-layout { grid-template-columns:1fr; }
          .appt-sidebar { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
          .appt-tips { grid-column:span 2; }
        }
        @media(max-width:768px){
          .appt-hero { padding:72px 24px 48px; }
          .appt-hero-inner { flex-direction:column; gap:32px; }
          .appt-hero-right { flex-direction:row; flex-wrap:wrap; }
          .appt-body { padding:32px 24px 56px; }
          .apf-row { grid-template-columns:1fr; gap:16px; }
          .apf-dept-grid { grid-template-columns:repeat(3,1fr); }
          .appt-sidebar { grid-template-columns:1fr; }
          .appt-tips { grid-column:auto; }
        }
      `}</style>

      <div style={{ paddingTop: "70px" }}>
        {/* HERO */}
        <section className="appt-hero">
          <div className="appt-hero-orb appt-hero-orb-1" />
          <div className="appt-hero-orb appt-hero-orb-2" />
          <div className="appt-hero-inner">
            <div className={`appt-hero-left ${heroVis ? "vis" : ""}`}>
              <div className="appt-hero-tag">
                <span className="appt-hero-tag-dot" />
                Book an Appointment
              </div>
              <h1>
                Your Health,
                <br />
                <em>Our Priority</em>
              </h1>
              <p>
                Schedule a visit with our verified specialists in seconds.
                Simple, fast, and completely hassle-free.
              </p>
            </div>
            <div className={`appt-hero-right ${heroVis ? "vis" : ""}`}>
              {[
                {
                  icon: "✅",
                  title: "Verified Doctors",
                  sub: "All specialists are certified",
                },
                {
                  icon: "⚡",
                  title: "Instant Confirmation",
                  sub: "Booking confirmed immediately",
                },
                {
                  icon: "🔒",
                  title: "Secure & Private",
                  sub: "Your data is fully protected",
                },
              ].map((p, i) => (
                <div className="appt-info-pill" key={i}>
                  <span className="appt-info-pill-icon">{p.icon}</span>
                  <div className="appt-info-pill-text">
                    <strong>{p.title}</strong>
                    <span>{p.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BODY */}
        <div className="appt-body">
          <div className="appt-layout">
            {/* LEFT: Form */}
            <div>
              <div className="appt-steps">
                <div
                  className={`appt-step ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`}
                  onClick={() => setStep(1)}
                >
                  <div className="appt-step-circle">{step > 1 ? "✓" : "1"}</div>
                  <span className="appt-step-label">Personal Info</span>
                </div>
                <div className={`appt-step-line ${step > 1 ? "done" : ""}`} />
                <div className={`appt-step ${step >= 2 ? "active" : ""}`}>
                  <div className="appt-step-circle">2</div>
                  <span className="appt-step-label">Appointment</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/*  STEP 1  */}
                {step === 1 && (
                  <div className="appt-form-card">
                    <div className="appt-form-header">
                      <div className="appt-form-header-icon">👤</div>
                      <div>
                        <h3>Personal Information</h3>
                        <p>Tell us a bit about yourself</p>
                      </div>
                    </div>
                    <div className="appt-form-body">
                      <div className="apf-row">
                        <div className="apf-group">
                          <label>First Name</label>
                          <input
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            placeholder="e.g. Piyush"
                            required
                          />
                        </div>
                        <div className="apf-group">
                          <label>Last Name</label>
                          <input
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            placeholder="e.g. Jha"
                            required
                          />
                        </div>
                      </div>
                      <div className="apf-row">
                        <div className="apf-group">
                          <label>Email Address</label>
                          <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@email.com"
                            required
                          />
                        </div>
                        <div className="apf-group">
                          <label>Phone Number</label>
                          <input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="10-digit number"
                            required
                            maxLength={15}
                            pattern="[0-9]{10,15}"
                            title="Please enter a valid phone number"
                          />
                        </div>
                      </div>
                      <div className="apf-row">
                        <div className="apf-group">
                          <label>Date of Birth</label>
                          <input
                            name="dob"
                            type="date"
                            value={form.dob}
                            onChange={handleChange}
                            required
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div className="apf-group">
                          <label>Age</label>
                          {form.age ? (
                            <div className="apf-age-wrap">
                              <input value={`${form.age} years old`} readOnly />
                              <span className="apf-age-badge">
                                🎂 {form.age} yrs
                              </span>
                            </div>
                          ) : (
                            <input
                              value=""
                              readOnly
                              placeholder="Auto-calculated from DOB"
                            />
                          )}
                        </div>
                      </div>
                      <div className="apf-row">
                        <div className="apf-group">
                          <label>Gender</label>
                          <select
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="apf-group">
                          <label>Address</label>
                          <input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Your full address"
                            required
                          />
                        </div>
                      </div>
                      <div className="apf-nav">
                        <div />
                        <button
                          type="button"
                          className="apf-next-btn"
                          disabled={!step1Valid}
                          onClick={() => step1Valid && setStep(2)}
                        >
                          Continue to Appointment →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/*  STEP 2  */}
                {step === 2 && (
                  <div className="appt-form-card">
                    <div className="appt-form-header">
                      <div className="appt-form-header-icon">📅</div>
                      <div>
                        <h3>Appointment Details</h3>
                        <p>
                          Choose your department, doctor, date and time slot
                        </p>
                      </div>
                    </div>
                    <div className="appt-form-body">
                      {/* Date */}
                      <div className="apf-row-single">
                        <div className="apf-group">
                          <label>Preferred Appointment Date</label>
                          <input
                            name="appointment_date"
                            type="date"
                            value={form.appointment_date}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>

                      {/* Department */}
                      <div className="apf-divider">
                        <div className="apf-divider-line" />
                        <span className="apf-divider-label">
                          Select Department
                        </span>
                        <div className="apf-divider-line" />
                      </div>
                      <div
                        className="apf-dept-grid"
                        style={{ marginBottom: 24 }}
                      >
                        {departments.map((d) => (
                          <button
                            type="button"
                            key={d.name}
                            className={`apf-dept-btn ${form.department === d.name ? "selected" : ""}`}
                            onClick={() =>
                              handleChange({
                                target: { name: "department", value: d.name },
                              })
                            }
                          >
                            <span className="apf-dept-emoji">{d.emoji}</span>
                            <span className="apf-dept-name">{d.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Doctor */}
                      <div className="apf-divider">
                        <div className="apf-divider-line" />
                        <span className="apf-divider-label">Select Doctor</span>
                        <div className="apf-divider-line" />
                      </div>

                      {!form.department ? (
                        <div
                          className="apf-no-doctors"
                          style={{ marginBottom: 24 }}
                        >
                          <span>🏥</span>
                          <div>
                            <strong>No Department Selected</strong>
                            <p>
                              Please select a department above to see available
                              doctors.
                            </p>
                          </div>
                        </div>
                      ) : filteredDoctors.length === 0 ? (
                        <div
                          className="apf-no-doctors"
                          style={{ marginBottom: 24 }}
                        >
                          <span>🔍</span>
                          <div>
                            <strong>No Doctors in {form.department}</strong>
                            <p>Please try a different department.</p>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="apf-doctor-grid"
                          style={{ marginBottom: 24 }}
                        >
                          {filteredDoctors.map((d) => {
                            const key = `${d.firstName}|||${d.lastName}`;
                            const isSelected = selectedDoctor === key;
                            return (
                              <div
                                key={d._id}
                                className={`apf-doctor-card ${isSelected ? "selected" : ""}`}
                                onClick={() => handleDoctorSelect(d)}
                              >
                                <img
                                  className="apf-doctor-img"
                                  src={d.docAvatar?.url || getDoctorAvatar(d)}
                                  alt={d.firstName}
                                  onError={(e) =>
                                    (e.target.src = getDoctorAvatar(d))
                                  }
                                />
                                <div className="apf-doctor-info">
                                  <div className="apf-doctor-name">
                                    Dr. {d.firstName} {d.lastName}
                                  </div>
                                  <div className="apf-doctor-dept">
                                    {d.doctorDepartment} Specialist
                                  </div>
                                </div>
                                <div className="apf-doctor-check">
                                  {isSelected ? "✓" : ""}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ✅ SLOT PICKER — shows after doctor + date are both selected */}
                      {selectedDoctorId && form.appointment_date && (
                        <div className="apf-slot-section">
                          <SlotPicker
                            doctorId={selectedDoctorId}
                            date={form.appointment_date}
                            selected={selectedSlot}
                            onSelect={(slot) => setSelectedSlot(slot)}
                          />
                        </div>
                      )}

                      {/* Visited before */}
                      <div className="apf-checkbox">
                        <input
                          name="hasVisited"
                          type="checkbox"
                          checked={form.hasVisited}
                          onChange={handleChange}
                          id="hasVisited"
                        />
                        <label htmlFor="hasVisited">
                          I have visited Cliniqo before
                        </label>
                      </div>

                      <div className="apf-nav">
                        <button
                          type="button"
                          className="apf-back-btn"
                          onClick={() => setStep(1)}
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          className="apf-next-btn"
                          disabled={
                            loading ||
                            !form.appointment_date ||
                            !form.department ||
                            !form.doctor_firstName ||
                            (form.department !== "" &&
                              filteredDoctors.length === 0)
                          }
                        >
                          {loading ? (
                            <>
                              <span className="apf-spinner" /> Booking...
                            </>
                          ) : (
                            "✅ Confirm Appointment"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="appt-sidebar">
              <div className="appt-summary">
                <div className="appt-summary-header">
                  <span>📋</span>
                  <h4>Booking Summary</h4>
                </div>
                <div className="appt-summary-body">
                  {[
                    {
                      icon: "👤",
                      label: "Patient",
                      value: form.firstName
                        ? `${form.firstName} ${form.lastName}`
                        : null,
                    },
                    {
                      icon: "🏥",
                      label: "Department",
                      value: form.department
                        ? `${selectedDeptMeta?.emoji || ""} ${form.department}`
                        : null,
                    },
                    {
                      icon: "🩺",
                      label: "Doctor",
                      value: form.doctor_firstName
                        ? `Dr. ${form.doctor_firstName} ${form.doctor_lastName}`
                        : null,
                    },
                    {
                      icon: "📅",
                      label: "Date",
                      value: form.appointment_date
                        ? new Date(form.appointment_date).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "long", year: "numeric" },
                          )
                        : null,
                    },
                    // ✅ NEW — time slot row in summary
                    {
                      icon: "🕐",
                      label: "Time Slot",
                      value: selectedSlot ? selectedSlot : null,
                    },
                  ].map((row, i) => (
                    <div className="appt-summary-row" key={i}>
                      <div className="appt-summary-icon">{row.icon}</div>
                      <div className="appt-summary-info">
                        <strong>{row.label}</strong>
                        {row.value ? (
                          <span>{row.value}</span>
                        ) : (
                          <span className="empty">Not selected yet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDoctorObj && (
                <div className="appt-doctor-preview">
                  <div className="adp-header">
                    <img
                      className="adp-img"
                      src={
                        selectedDoctorObj.docAvatar?.url ||
                        getDoctorAvatar(selectedDoctorObj)
                      }
                      alt={selectedDoctorObj.firstName}
                      onError={(e) =>
                        (e.target.src = getDoctorAvatar(selectedDoctorObj))
                      }
                    />
                    <div>
                      <div className="adp-name">
                        Dr. {selectedDoctorObj.firstName}{" "}
                        {selectedDoctorObj.lastName}
                      </div>
                      <div className="adp-dept">
                        {selectedDoctorObj.doctorDepartment} Specialist
                      </div>
                    </div>
                  </div>
                  <div className="adp-stats">
                    <div className="adp-stat">
                      <strong>10+</strong>
                      <span>Yrs Exp</span>
                    </div>
                    <div className="adp-stat">
                      <strong>500+</strong>
                      <span>Patients</span>
                    </div>
                    <div className="adp-stat">
                      <strong>4.9★</strong>
                      <span>Rating</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="appt-tips">
                <h4>💡 Before your visit</h4>
                <ul>
                  <li>Bring any previous medical reports or prescriptions</li>
                  <li>Arrive 10 minutes before your appointment time</li>
                  <li>You'll receive a confirmation email after booking</li>
                  <li>Carry a valid photo ID for verification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentForm;
