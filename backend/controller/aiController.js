import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";

// ── Symptom keyword list for validation ──────────────────────────────────────
const SYMPTOM_KEYWORDS = [
  "pain","ache","aching","sore","soreness","hurt","hurting","tender","tenderness","cramp","cramping","spasm","burning","stinging","throbbing","sharp","dull","pressure","discomfort",
  "fever","febrile","temperature","chills","sweating","sweats","night sweats","hot","flushed","shivering","rigors",
  "cough","coughing","breathless","shortness of breath","sob","wheeze","wheezing","chest tightness","mucus","phlegm","sputum","runny nose","congestion","nasal","sneeze","sneezing","hoarse","hoarseness",
  "nausea","nauseous","vomiting","vomit","diarrhea","diarrhoea","constipation","bloating","bloated","stomach","abdomen","abdominal","indigestion","heartburn","reflux","loss of appetite","anorexia","weight loss","bloody stool","black stool",
  "headache","migraine","dizziness","dizzy","lightheaded","vertigo","confusion","disoriented","memory","seizure","fainting","faint","syncope","tremor","numbness","tingling","weakness",
  "rash","itching","itchy","swelling","swollen","redness","lesion","bruise","wound","blister","hives","jaundice","yellow",
  "palpitation","palpitations","heart","chest pain","chest tightness","edema","swollen legs","swollen ankles","claudication",
  "blurred vision","vision","eye pain","ear pain","hearing","tinnitus","sore throat","throat","swallowing","difficulty swallowing",
  "urination","urinary","dysuria","frequency","burning urination","blood in urine","urine","kidney",
  "joint","joints","stiffness","muscle","muscles","back pain","neck pain","shoulder pain","knee pain","hip pain",
  "fatigue","tired","tiredness","lethargy","malaise","weakness","weight","appetite","insomnia","sleep","anxiety","depression","mood","bleeding","discharge","infection","inflammation",
  "for days","for weeks","for hours","since","started","began","worsening","getting worse","improving","chronic","acute","sudden","gradually","intermittent","constant","recurrent",
];

// ── Validate symptom input ────────────────────────────────────────────────────
function validateSymptomInput(text) {
  if (!text || typeof text !== "string") return { valid: false, reason: "No input provided." };
  const trimmed = text.trim();
  if (trimmed.length < 15) return { valid: false, reason: "Input is too short. Please describe symptoms in detail (minimum 15 characters)." };
  if (trimmed.length > 2000) return { valid: false, reason: "Input is too long. Please keep it under 2000 characters." };
  if (!/[a-zA-Z]{3,}/.test(trimmed)) return { valid: false, reason: "Input must contain descriptive text about symptoms." };
  const INVALID_PATTERNS = [
    /^(hi|hello|hey|test|testing|ok|okay|yes|no|lol|haha|bye|thanks|thank you|please|help|what|why|how|who|when|where)[\s!?.]*$/i,
    /^[^a-zA-Z]*$/,
    /^(.)\1{4,}$/,
  ];
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(trimmed)) return { valid: false, reason: "Please enter actual medical symptoms, not greetings or single words." };
  }
  const lower = trimmed.toLowerCase();
  const foundKeyword = SYMPTOM_KEYWORDS.some(kw => lower.includes(kw));
  if (!foundKeyword) return { valid: false, reason: "No recognizable symptoms detected. Please describe symptoms such as fever, pain, cough, dizziness, nausea, etc." };
  return { valid: true };
}

// ── All Groq keys ─────────────────────────────────────────────────────────────
const ALL_GROQ_KEYS = () => [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean);

// ── Shared Groq chat helper ───────────────────────────────────────────────────
async function callGroq(systemPrompt, userMessage, maxTokens = 1000, model = "llama-3.3-70b-versatile") {
  const keys = ALL_GROQ_KEYS();
  let lastError;
  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${keys[i]}` },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userMessage  },
          ],
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Groq API error ${res.status}: ${errText}`);
        continue;
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error("All Groq API keys failed");
}

// ── POST /api/v1/ai/analyse ───────────────────────────────────────────────────
export const analyseSymptoms = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    const validation = validateSymptomInput(symptoms);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason, type: "INVALID_SYMPTOMS" });
    }
    const cleanedSymptoms = symptoms.trim().replace(/\s+/g, " ");
    const system =
      "You are a clinical decision support assistant. Respond ONLY with valid JSON, no markdown, no explanation, no backticks. " +
      "If the input does not describe medical symptoms, return: {\"error\": \"No valid symptoms detected\"}";
    const prompt = `Patient presents with: "${cleanedSymptoms}". 
Return JSON only (no markdown, no backticks, just raw JSON):
{
  "possibleConditions": [{"name":"string","likelihood":"High|Medium|Low","icd10":"string"}],
  "redFlags": ["string"],
  "recommendedTests": ["string"],
  "initialManagement": "string",
  "urgency": "Emergency|Urgent|Semi-urgent|Routine",
  "urgencyColor": "#hexcolor"
}`;
    const text = await callGroq(system, prompt, 1000);
    const cleaned = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    if (result.error) {
      return res.status(400).json({ success: false, message: "The AI could not identify valid medical symptoms in your input. Please describe specific symptoms.", type: "INVALID_SYMPTOMS" });
    }
    res.json({ success: true, result });
  } catch (err) {
    console.log("ANALYSE ERROR:", err.message);
    next(err);
  }
};

// ── POST /api/v1/ai/chat ──────────────────────────────────────────────────────
export const doctorChat = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ success: false, message: "Question is required" });
    const system = "You are an expert AI medical assistant helping a licensed doctor. Be concise, accurate, and clinical. Never refuse medical questions — the doctor is a professional.";
    const text = await callGroq(system, question, 1000);
    res.json({ success: true, answer: text });
  } catch (err) {
    console.log("CHAT ERROR:", err.message);
    next(err);
  }
};

// ── POST /api/v1/ai/patient-chat ──────────────────────────────────────────────
export const patientChat = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ success: false, message: "Question is required" });
    const system = `You are a friendly, empathetic AI health assistant helping a patient.
Guidelines:
- Give clear, easy-to-understand answers (avoid heavy jargon)
- Always recommend consulting their doctor for diagnosis or treatment changes
- Be warm and reassuring, not alarming
- Never diagnose — help them understand and prepare questions for their doctor`;
    const text = await callGroq(system, question, 800);
    res.json({ success: true, answer: text });
  } catch (err) {
    console.log("PATIENT CHAT ERROR:", err.message);
    next(err);
  }
};

// ── POST /api/v1/ai/sara/transcribe — Groq Whisper STT ───────────────────────
export const saraTranscribe = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file" });

    const keys = ALL_GROQ_KEYS();
    let lastError;

    for (let i = 0; i < keys.length; i++) {
      try {
        const form = new FormData();
        form.append("file", fs.createReadStream(req.file.path), {
          filename: "audio.webm",
          contentType: req.file.mimetype || "audio/webm",
        });
        form.append("model", "whisper-large-v3-turbo");
        form.append("language", "en");
        form.append("response_format", "json");
        form.append("prompt", "Medical dashboard. Doctor speaking. Drug names, diagnoses, appointments, prescription, video call, patient names.");

        const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${keys[i]}`, ...form.getHeaders() },
          body: form,
        });

        if (!resp.ok) {
          const errText = await resp.text();
          lastError = new Error(`Groq Whisper ${resp.status}: ${errText}`);
          continue;
        }

        const data = await resp.json();
        fs.unlink(req.file.path, () => {});
        return res.json({ text: data.text?.trim() || "" });
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    fs.unlink(req.file.path, () => {});
    throw lastError || new Error("All Groq Whisper keys failed");
  } catch (err) {
    console.error("SARA TRANSCRIBE ERROR:", err.message);
    next(err);
  }
};

// ── POST /api/v1/ai/sara/respond — Groq LLM command understanding ─────────────
export const saraRespond = async (req, res, next) => {
  try {
    const { text, context } = req.body;
    if (!text?.trim()) return res.status(400).json({ reply: null });

    const now = new Date().toLocaleString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit", hour12: true,
      timeZone: "Asia/Kolkata",
    });

    const rxSummary = [
      context?.rxForm?.patientName  ? `Patient: ${context.rxForm.patientName}`        : null,
      context?.rxForm?.patientAge   ? `Age: ${context.rxForm.patientAge}`              : null,
      context?.rxForm?.patientEmail ? `Email: ${context.rxForm.patientEmail}`          : null,
      context?.rxForm?.diagnosis    ? `Diagnosis: ${context.rxForm.diagnosis}`         : null,
      context?.rxForm?.drugs?.[0]?.name ? `Drug: ${context.rxForm.drugs[0].name}`     : null,
    ].filter(Boolean).join(", ") || "empty";

    const system = `You are Sara, a warm intelligent voice assistant inside Cliniqo — a medical dashboard built by Piyush Kumar Jha.
You are speaking with Dr. ${context?.doctorName || "the Doctor"}, ${context?.dept || ""}.

LIVE DASHBOARD STATE:
- Current time: ${now}
- Today's appointments: ${context?.todayCount ?? 0}
- Pending appointments: ${context?.pending ?? 0}
- Pending video calls: ${context?.pendingVC ?? 0}
- Unread notifications: ${context?.unreadNotifs ?? 0}
- Total patients: ${context?.patientCount ?? 0}
- Active tab: ${context?.activeTab || "overview"}
- Prescription form: ${rxSummary}

RESPONSE RULES — READ CAREFULLY:
1. Navigation commands (go to X, open X, show X) → reply ONLY with this exact JSON: {"action":"navigate","tab":"overview"} 
   Valid tabs: overview, appointments, patients, prescription, videoconsult, notifications, profile
2. Fill form field → ONLY JSON: {"action":"fill","field":"patientName","value":"Piyush Jha"}
   Valid fields: patientName, patientAge, patientEmail, diagnosis
3. Save prescription → ONLY JSON: {"action":"savePrescription"}
4. Accept latest appointment → ONLY JSON: {"action":"acceptAppointment"}
5. Reject latest appointment → ONLY JSON: {"action":"rejectAppointment"}
6. Accept video call → ONLY JSON: {"action":"acceptVideoCall"}
7. Reject video call → ONLY JSON: {"action":"rejectVideoCall"}
8. Refresh data → ONLY JSON: {"action":"refresh"}
9. Mark notifications read → ONLY JSON: {"action":"markAllRead"}
10. General conversation, time, date, jokes, compliments, questions about you → plain English, max 2 warm sentences, no markdown.
11. NEVER invent patient data, diagnoses, vitals, medications, test results or any clinical values.
12. NEVER use asterisks, bullet points, lists or markdown in spoken replies.
13. If unsure whether to return JSON or text — return plain text.`;

    const reply = await callGroq(system, text, 150, "llama-3.3-70b-versatile");
    return res.json({ reply: reply?.trim() || null });
  } catch (err) {
    console.error("SARA RESPOND ERROR:", err.message);
    next(err);
  }
};

// ── POST /api/v1/ai/sara/tts — Text to Speech ────────────────────────────────
// Priority: ElevenLabs → OpenAI TTS → 204 (browser fallback)
export const saraTTS = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "No text" });

    // Option A: ElevenLabs
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const resp = await fetch(
          "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
          {
            method: "POST",
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: text.trim(),
              model_id: "eleven_turbo_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.85, speed: 0.95 },
            }),
          }
        );
        if (resp.ok) {
          const buffer = await resp.arrayBuffer();
          res.set("Content-Type", "audio/mpeg");
          return res.send(Buffer.from(buffer));
        }
        console.warn("ElevenLabs TTS failed:", resp.status);
      } catch (e) {
        console.warn("ElevenLabs error:", e.message);
      }
    }

    // Option B: OpenAI TTS
    if (process.env.OPENAI_API_KEY) {
      try {
        const resp = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "tts-1", voice: "nova", input: text.trim(), speed: 0.95 }),
        });
        if (resp.ok) {
          const buffer = await resp.arrayBuffer();
          res.set("Content-Type", "audio/mpeg");
          return res.send(Buffer.from(buffer));
        }
        console.warn("OpenAI TTS failed:", resp.status);
      } catch (e) {
        console.warn("OpenAI TTS error:", e.message);
      }
    }

    // Option C: No TTS key — frontend uses browser Web Speech API
    return res.status(204).end();
  } catch (err) {
    console.error("SARA TTS ERROR:", err.message);
    next(err);
  }
};