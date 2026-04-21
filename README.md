# 🏥 Cliniqo - Hospital Management System

Your personal healthcare platform. Built with MERN Stack.

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

**Update `config.env`** with your credentials:
```
PORT=5000
MONGO_URI=mongodb+srv://piyushjha1134_db_user:qVTzURLYpjGg9tdO@hsm.eejtwhj.mongodb.net/HSM?retryWrites=true&w=majority&appName=HSM
JWT_SECRET_KEY=cliniqo_secret_key_2024_piyush
JWT_EXPIRES=7d
COOKIE_EXPIRE=7
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=dqjwxm8bo
CLOUDINARY_API_KEY=431457789997321
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_SECRET_HERE  ← Replace this!
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
| `/` | Home |
| `/appointment` | Book Appointment |
| `/about` | About Us |
| `/login` | Login (Patient OR Admin toggle) |
| `/register` | Patient Registration |
| `/admin/login` | Admin Login |
| `/admin/dashboard` | Admin Dashboard |
| `/admin/appointments` | Manage Appointments |
| `/admin/doctors` | View Doctors |
| `/admin/messages` | View Messages |
| `/admin/doctor/addnew` | Add New Doctor |
| `/admin/addnew` | Add New Admin |

---

## 🔑 First Admin Setup

To create your first admin, use a tool like **Postman** or **Thunder Client**:

```
POST https://cliniqo-backend.onrender.com/api/v1/user/login/api/v1/user/patient/register
```
Then change the role in MongoDB directly from "Patient" to "Admin".

OR use the seed route if you add one.

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
- **Styling**: Custom CSS (Green & White medical theme)
