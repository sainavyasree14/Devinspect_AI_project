import axios from 'axios';

/* ─────────────────────────────
   MODE NORMALIZATION
───────────────────────────── */
export const normalizeMode = (mode) => {
  const lower = String(mode || '').toLowerCase();

  if (lower.includes('student')) return 'student';
  if (lower.includes('interview')) return 'interviewer';

  return 'developer';
};

/* ─────────────────────────────
   PROMPT BUILDER
───────────────────────────── */
const buildPrompt = (code, mode) => {
  const base = `
You are DevInspectAI.

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No explanations outside JSON
- Ensure JSON is parseable
`;

  if (mode === 'interviewer') {
    return `
${base}

MODE: INTERVIEWER

Return JSON:
{
  "correctedCode": "",
  "explanation": "",
  "aiScore": 0,
  "questions": [
    {
      "question": "",
      "answer": "",
      "difficulty": "easy|medium|hard"
    }
  ],
  "errors": [],
  "suggestions": [],
  "modeOutput": "interview readiness summary"
}

CODE:
${code}
`;
  }

  if (mode === 'student') {
    return `
${base}

MODE: STUDENT

Return JSON:
{
  "correctedCode": "",
  "explanation": "",
  "aiScore": 0,
  "steps": [],
  "mistakes": [],
  "tips": [],
  "questions": [],
  "errors": [],
  "modeOutput": "learning summary"
}

CODE:
${code}
`;
  }

  return `
${base}

MODE: DEVELOPER

Return JSON:
{
  "correctedCode": "",
  "explanation": "",
  "aiScore": 0,
  "errors": [],
  "suggestions": [],
  "questions": [],
  "modeOutput": "developer review summary"
}

CODE:
${code}
`;
};

/* ─────────────────────────────
   SAFE JSON PARSER
───────────────────────────── */
const extractJSON = (text) => {
  try {
    if (!text) return null;

    const clean = String(text)
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');

    if (start === -1 || end === -1) return null;

    return JSON.parse(clean.slice(start, end + 1));
  } catch (err) {
    console.error("JSON parse failed:", err.message);
    return null;
  }
};

/* ─────────────────────────────
   OPENROUTER CALL
───────────────────────────── */
const callAI = async (prompt) => {
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a strict JSON generator. Output ONLY JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = res.data?.choices?.[0]?.message?.content;

    return extractJSON(content);
  } catch (err) {
    console.error("AI API Error:", err.message);
    return null;
  }
};

/* ─────────────────────────────
   MAIN ANALYSIS FUNCTION
───────────────────────────── */
export const analyzeContent = async (code, mode) => {
  const finalMode = normalizeMode(mode);

  try {
    const prompt = buildPrompt(code, finalMode);
    const ai = await callAI(prompt);

    if (!ai) throw new Error("Invalid AI response");

    return {
      correctedCode: ai.correctedCode || code,
      explanation: ai.explanation || "",
      aiScore: ai.aiScore ?? 80,
      errors: Array.isArray(ai.errors) ? ai.errors : [],
      suggestions: Array.isArray(ai.suggestions) ? ai.suggestions : [],
      questions: Array.isArray(ai.questions) ? ai.questions : [],
      steps: Array.isArray(ai.steps) ? ai.steps : [],
      modeOutput: ai.modeOutput || ""
    };
  } catch (e) {
    return {
      correctedCode: code,
      explanation: "AI fallback mode (offline or parsing error)",
      aiScore: 70,
      errors: [],
      suggestions: [],
      questions: [],
      steps: [],
      modeOutput: "fallback mode"
    };
  }
};

/* ─────────────────────────────
   HEALTH CHECK (FIXED ERROR)
───────────────────────────── */
export const checkAiHealth = async () => {
  try {
    const res = await axios.get(
      'https://openrouter.ai/api/v1/models',
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    return {
      status: 'ok',
      models: res.data?.data?.length || 0,
    };
  } catch (err) {
    return {
      status: 'error',
      message: err.message,
    };
  }
};