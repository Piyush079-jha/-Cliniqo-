# 🏥 Cliniqo - AI-Powered Hospital Management System

Your smartest healthcare companion. Book doctors, consult live, and get AI-driven guidance — all in one place. Built with MERN Stack.

---

## 📁 Project Structure

```
cliniqo/
├── backend/        ← Node.js + Express + MongoDB
└── frontend/       ← React + Vite (includes admin panel at /admin)
```

---

## ⚙️ Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

**Create a `config.env`** file inside the backend folder with these values:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
JWT_EXPIRES=7d
COOKIE_EXPIRE=7
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_EMAIL=your_smtp_email
SMTP_PASSWORD=your_smtp_app_password
```

Then run:
```bash
node server.js
```

You should see:
```
Server listening at port 5000
Connected to database!
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at: **http://localhost:5173**

---

## 🌐 Routes

| URL | Page |
|-----|------|
| `/` | Login |
| `/register` | Patient Registration |
| `/appointment` | Book Appointment |
| `/about` | About Us |
| `/admin/login` | Admin Login |
| `/admin/dashboard` | Admin Dashboard |
| `/admin/appointments` | Manage Appointments |
| `/admin/doctors` | View Doctors |
| `/admin/messages` | View Messages |
| `/admin/doctor/addnew` | Add New Doctor |
| `/admin/addnew` | Add New Admin |
| `/doctor/dashboard` | Doctor Dashboard |
| `/patient/dashboard` | Patient Dashboard |
| `/video/:appointmentId` | Video Consultation |

---

## 🔑 First Admin Setup

To create your first admin, use a tool like **Postman** or **Thunder Client**:

```
POST http://localhost:5000/api/v1/user/patient/register
```
Then change the role in MongoDB directly from "Patient" to "Admin".

---

## 📦 Images (Optional)

If you have the original department images, place them in:
```
frontend/public/departments/
  pedia.jpg, ortho.jpg, cardio.jpg, neuro.jpg,
  onco.jpg, radio.jpg, therapy.jpg, derma.jpg, ent.jpg
```

Without images, emoji placeholders will show instead.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Auth**: JWT + Cookies
- **Image Upload**: Cloudinary
- **Real-time**: Socket.IO (video consultations & notifications)
- **AI Assistant**: Integrated AI chat for patient guidance
- **Styling**: Custom CSS (Green & White medical theme)

---

## ✨ Features

- 🤖 AI-powered assistant for patient queries and doctor recommendations
- 📹 Live video consultations between doctor and patient
- 📅 Appointment booking and management
- 🔒 Role-based access — Patient, Doctor, Admin
- 📧 Forgot password via email (Nodemailer)
- ☁️ Cloudinary image uploads for doctor avatars
- 📊 Admin dashboard with full control

---

## 👨‍💻 About

Built by **Piyush Kumar Jha** — a full-stack developer from India. If you found this useful, a ⭐ on the repo would mean a lot!