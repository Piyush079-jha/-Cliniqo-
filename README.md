# 🏥 Cliniqo — AI-Powered Hospital Management System

Cliniqo is a full-stack hospital management system I built using the MERN stack. It has everything you'd expect from a real healthcare platform — booking appointments, live video consultations, an AI assistant to guide patients, and even a voice assistant to help doctors work hands-free.

🔗 Live Demo: https://cliniqo-ten.vercel.app/

---

## ✨ What it can do

- Sign up, log in, and reset your password securely using JWT authentication
- Book appointments with doctors across 25+ specialities
- Chat with an AI assistant that understands your symptoms and recommends the right doctor
- Doctors get a voice assistant to manage schedules and appointments hands-free
- Live peer-to-peer video consultations between doctor and patient powered by WebRTC
- Role-based dashboards for Patient, Doctor and Admin
- Admins can manage doctors, appointments, messages and reviews from a full control panel
- Secure forgot password flow via email using Nodemailer
- Doctor avatars uploaded and stored on Cloudinary

---

## 🧰 Tech Stack

**Frontend:** React 18, Vite, React Router  
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT  
**Real-time:** Socket.IO, WebRTC  
**AI Assistant:** Claude AI  
**Voice Assistant:** Web Speech API  
**Image Upload:** Cloudinary  
**Deployment:** Vercel (Frontend), Render (Backend)

---

## 🚀 Deployed on Vercel

The frontend is live on Vercel. If you want to deploy your own copy, here's how:

1. Push your code to GitHub
2. Go to vercel.com, create a new project and import your repo
3. Set the root directory to `frontend`
4. Add your backend URL as an environment variable:
```
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```
5. Hit deploy and you're done!

For the backend, deploy on Render — it's free and works great with Node.js apps.

---

## ⚙️ Running it locally

```bash
# Clone the repo
git clone https://github.com/Piyush079-jha/-Cliniqo-.git

# Start the backend
cd backend
npm install
node server.js

# Start the frontend (open a new terminal)
cd frontend
npm install
npm run dev
```

Create a `config.env` file inside the `backend` folder with these values:

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

---

## 👨‍💻 About Me

Hi, I'm Piyush Jha — a passionate full-stack developer from India who loves turning ideas into real, working products. I built Cliniqo from scratch to sharpen my MERN skills and explore how AI and real-time tech can make healthcare more accessible. If you found this project useful, a ⭐ on the repo would mean a lot! And if you want to connect, collaborate, or just say hi — I'm always up for it. 🙌

[![GitHub](https://img.shields.io/badge/GitHub-Piyush079--jha-181717?style=for-the-badge&logo=github)](https://github.com/Piyush079-jha)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Piyush%20Jha-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/piyush-jha1134/)

Built with ❤️ using MERN Stack + AI