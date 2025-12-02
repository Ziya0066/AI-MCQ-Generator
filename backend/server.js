// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(cors());

// --- GEMINI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper: safely extract JSON from model response
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("No valid JSON in AI response");
  }
}

/*
  POST /generate-mcqs
  Body:
  {
    "subject": "DBMS",
    "topic": "Normalization",
    "numQuestions": 5,
    "difficulty": "Medium"
  }
*/
app.post("/generate-mcqs", async (req, res) => {
  try {
    const { subject, topic, numQuestions, difficulty } = req.body;

    const safeNum = Math.min(Math.max(Number(numQuestions) || 5, 1), 20);

    const prompt = `
You are an exam-focused MCQ generator.

Create ${safeNum} multiple-choice questions for:
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${difficulty} (Easy / Medium / Hard)

Rules:
1. Each question must be clear and unambiguous.
2. Exactly 4 options per question.
3. Only ONE correct option.
4. Options must be plausible, not silly.
5. Avoid "All of the above"/"None of the above".
6. Provide a short explanation for each answer (1–3 sentences).

Return ONLY valid JSON in this format:

{
  "mcqs": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Short explanation here."
    }
  ]
}

Do NOT include any markdown, backticks, or extra commentary.
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const json = extractJSON(raw);

    // basic sanity check
    if (!json.mcqs || !Array.isArray(json.mcqs)) {
      throw new Error("Invalid MCQ structure from AI");
    }

    res.json(json);
  } catch (err) {
    console.error("MCQ Error:", err);
    res.status(500).json({ error: "Failed to generate MCQs" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`MCQ Generator running on port ${PORT}`));
