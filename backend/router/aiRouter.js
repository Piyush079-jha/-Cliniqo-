import express from "express";
import multer from "multer";
import { mkdirSync } from "fs";
import { analyseSymptoms, doctorChat, patientChat, saraTranscribe, saraRespond, saraTTS } from "../controller/aiController.js";
import { isDoctorAuthenticated, isPatientAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// ── Multer for Sara audio uploads ─────────────────────────────────────────────
mkdirSync("uploads/sara_audio", { recursive: true });

const saraUpload = multer({
  dest: "uploads/sara_audio/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) return cb(null, true);
    cb(new Error("Only audio files are allowed"));
  },
});

// ── Existing routes ───────────────────────────────────────────────────────────
router.post("/analyse",      isDoctorAuthenticated,  analyseSymptoms);
router.post("/chat",         isDoctorAuthenticated,  doctorChat);
router.post("/patient-chat", isPatientAuthenticated, patientChat);

// ── Sara legacy text command route (kept for backward compat) ─────────────────
router.post("/sara", isDoctorAuthenticated, async (req, res) => {
  const { cmd, context } = req.body;
  if (!cmd || typeof cmd !== "string" || cmd.length > 300) {
    return res.status(400).json({ reply: null });
  }

  const BLOCKED_TERMS = [
    "prescription", "medicine", "drug", "tablet", "capsule", "diagnosis",
    "diagnosed", "patient", "blood pressure", "sugar", "glucose", "fever",
    "temperature", "symptom", "pain", "mg", "ml", "dose", "report",
    "test result", "appointment", "accept", "reject", "video", "call",
    "overview", "profile", "notification", "alert", "refresh", "reload",
  ];
  const cmdLower = cmd.toLowerCase();
  const isBlocked = BLOCKED_TERMS.some(term => cmdLower.includes(term));
  if (isBlocked) return res.json({ reply: null });

  const SARA_SYSTEM = `You are Sara, a voice assistant inside a doctor dashboard called Cliniqo. Built by Piyush Kumar Jha.

STRICT RULES:
1. NEVER invent any patient name, age, diagnosis, blood pressure, sugar level, medication, test result, vital sign or clinical data.
2. NEVER mention specific appointment details you were not explicitly given.
3. You only know: Doctor is ${context?.doctorName}, dept ${context?.dept}, today has ${context?.todayCount} appointments, ${context?.pending} pending, ${context?.pendingVC} video requests, ${context?.unreadNotifs} alerts, ${context?.patientCount} total patients.
4. If asked about patient, diagnosis, medicine or clinical detail — say: "I do not have that information. Please check the dashboard directly."
5. Plain conversational English only. No markdown, no asterisks, no bullets.
6. Maximum 2 short sentences. Never say "As an AI" or "I am a language model."
7. If asked who built you — say Piyush Kumar Jha built you.`;

  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_KEY_3,
  ].filter(Boolean);

  for (let i = 0; i < keys.length; i++) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${keys[i]}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 150,
          temperature: 0.3,
          messages: [
            { role: "system", content: SARA_SYSTEM },
            { role: "user",   content: cmd },
          ],
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (reply) return res.json({ reply });
    } catch (err) {
      console.warn(`Sara legacy key ${i + 1} failed:`, err.message);
      if (i < keys.length - 1) await new Promise(r => setTimeout(r, 200));
    }
  }
  res.json({ reply: null });
});

// ── Sara Voice Engine routes (Whisper → Groq LLM → TTS) ──────────────────────
router.post("/sara/transcribe", isDoctorAuthenticated, saraUpload.single("audio"), saraTranscribe);
router.post("/sara/respond",    isDoctorAuthenticated, saraRespond);
router.post("/sara/tts",        isDoctorAuthenticated, saraTTS);

export default router;