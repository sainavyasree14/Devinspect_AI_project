import groqService from "./groqService.js";
import https from 'https';

/* ─── Gemini call ────────────────────────────────── */
const callGemini = (prompt) => new Promise((resolve) => {
  if (!process.env.GEMINI_API_KEY) return resolve(null);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 },
  });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const parsed = new URL(url);
  const req = https.request(
    { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
    (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json?.candidates?.[0]?.content?.parts?.[0]?.text || null);
        } catch { resolve(null); }
      });
    }
  );
  req.on('error', () => resolve(null));
  req.write(body);
  req.end();
});

/* ─── OpenAI call ────────────────────────────────── */
const callOpenAI = (prompt) => new Promise((resolve) => {
  if (!process.env.OPENAI_API_KEY) return resolve(null);
  const body = JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: 'Return only strict JSON output.' }, { role: 'user', content: prompt }],
    temperature: 0.3,
  });
  const req = https.request(
    { hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Length': Buffer.byteLength(body) } },
    (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json?.choices?.[0]?.message?.content || null);
        } catch { resolve(null); }
      });
    }
  );
  req.on('error', () => resolve(null));
  req.write(body);
  req.end();
});

/* ─── Mode normalizer ────────────────────────────── */
export const normalizeMode = (mode) => {
  const lower = String(mode || '').toLowerCase().trim();
  if (lower.includes('student'))   return 'student';
  if (lower.includes('interview')) return 'interviewer';
  return 'developer';
};

/* ─── Prompt builder ─────────────────────────────── */
const buildPrompt = (code, mode) => {
  if (mode === 'student') {
    return `You are an expert programming teacher reviewing code for a beginner student.

STRICT RULES:
- Return ONLY a single valid JSON object
- No markdown, no code fences, no text before or after JSON
- Every field is required — never omit any field
- explanation must be at least 8 sentences covering: what the code does, what mistakes exist, why they happen, and how to fix them
- mistakes array must have at least 1 entry per real issue found
- steps must walk through the code line by line in simple language
- tips must give 3+ actionable learning tips
- errors array MUST list every real bug or syntax error found — do NOT leave it empty if the code has issues

Return this exact JSON shape:
{
  "correctedCode": "<full corrected code as string>",
  "explanation": "<detailed multi-sentence explanation, minimum 8 sentences>",
  "mistakes": [
    {
      "issue": "<what is wrong>",
      "whyItHappened": "<why this mistake happens>",
      "fix": "<how to fix it>"
    }
  ],
  "steps": ["<step 1>", "<step 2>", "<step 3>"],
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "questions": [],
  "errors": [
    {
      "line": <line number or 0>,
      "category": "<syntax | logic | style>",
      "severity": "<low | medium | high | critical>",
      "message": "<what is wrong>",
      "why": "<why this is a problem>",
      "fix": "<how to fix it>"
    }
  ],
  "suggestions": [],
  "modeOutput": "<a friendly 3-4 sentence summary for a student>"
}

CODE TO REVIEW:
\`\`\`
${code}
\`\`\``;
  }

  if (mode === 'interviewer') {
    return `You are a FAANG-level technical interviewer reviewing code to generate interview questions.

STRICT RULES:
- Return ONLY a single valid JSON object
- No markdown, no code fences, no text before or after JSON
- MUST generate exactly 6 questions (no fewer, no more)
- Each answer must be detailed — minimum 5 sentences explaining the concept, why it matters, and how it applies to this code
- difficulty must be one of: "easy", "medium", "hard"
- Include a mix: 2 easy, 2 medium, 2 hard
- explanation must describe what the code does in an interview context (4+ sentences)

Return this exact JSON shape:
{
  "correctedCode": "<corrected version of the code>",
  "explanation": "<4+ sentence explanation of what this code does in interview context>",
  "questions": [
    {
      "question": "<specific technical question about this code>",
      "answer": "<detailed answer, minimum 5 sentences>",
      "difficulty": "easy"
    },
    {
      "question": "<question>",
      "answer": "<detailed answer>",
      "difficulty": "easy"
    },
    {
      "question": "<question>",
      "answer": "<detailed answer>",
      "difficulty": "medium"
    },
    {
      "question": "<question>",
      "answer": "<detailed answer>",
      "difficulty": "medium"
    },
    {
      "question": "<question>",
      "answer": "<detailed answer>",
      "difficulty": "hard"
    },
    {
      "question": "<question>",
      "answer": "<detailed answer>",
      "difficulty": "hard"
    }
  ],
  "mistakes": [],
  "steps": [],
  "tips": [],
  "errors": [],
  "suggestions": [],
  "modeOutput": "<2-3 sentence interview readiness assessment>"
}

CODE TO REVIEW:
\`\`\`
${code}
\`\`\``;
  }

  // developer
  return `You are a senior software engineer doing a production-grade code review.

STRICT RULES:
- Return ONLY a single valid JSON object
- No markdown, no code fences, no text before or after JSON
- explanation must be a thorough senior-level review: minimum 10 sentences covering architecture, bugs, security, performance, and maintainability
- errors array MUST list EVERY real issue found — syntax errors, logic bugs, security holes, bad practices, missing error handling
- If the code has ANY bugs, wrong logic, syntax errors, or bad practices — you MUST include them in errors. NEVER return an empty errors array for broken or incorrect code
- If the code is truly perfect with zero issues, only then return errors as []
- Each error must have line number, category, severity, message, why it is wrong, and how to fix it
- suggestions must give 3+ concrete improvement recommendations
- correctedCode must be the fully refactored version with all bugs fixed

Return this exact JSON shape:
{
  "correctedCode": "<full refactored code with all bugs fixed>",
  "explanation": "<thorough senior-level review, minimum 10 sentences>",
  "errors": [
    {
      "line": <line number as integer or 0 if unknown>,
      "category": "<security | logic | performance | syntax | style>",
      "severity": "<low | medium | high | critical>",
      "message": "<what is wrong>",
      "why": "<why this is a problem>",
      "fix": "<how to fix it>"
    }
  ],
  "suggestions": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "mistakes": [],
  "steps": [],
  "tips": [],
  "questions": [],
  "modeOutput": "<clean structured production readiness summary, 3-5 sentences>"
}

CODE TO REVIEW:
\`\`\`
${code}
\`\`\``;
};

/* ─── JSON extractor with retry ──────────────────── */
const extractJSON = (text) => {
  if (!text) return null;
  try {
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = clean.indexOf('{');
    const end   = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
};

/* ─── AI call: Gemini → OpenAI → Groq fallback ───── */
const callAI = async (prompt) => {
  if (process.env.GEMINI_API_KEY) {
    const r = await callGemini(prompt);
    if (r) { console.log('[AI] Using Gemini'); return r; }
    console.warn('[AI] Gemini failed, trying OpenAI');
  }
  if (process.env.OPENAI_API_KEY) {
    const r = await callOpenAI(prompt);
    if (r) { console.log('[AI] Using OpenAI'); return r; }
    console.warn('[AI] OpenAI failed, trying Groq');
  }
  if (process.env.GROQ_API_KEY) {
    const r = await groqService(prompt);
    if (r) { console.log('[AI] Using Groq'); return r; }
  }
  return null;
};

/* ─── CI-friendly response mapper ────────────────── */
export const toCIResponse = (result) => ({
  score:          result.errors?.length > 0 ? Math.max(0, 100 - result.errors.length * 10) : 85,
  bugs:           (result.errors || []).filter(e => e.category === 'logic' || e.category === 'syntax'),
  securityIssues: (result.errors || []).filter(e => e.category === 'security'),
  suggestions:    result.suggestions || [],
  explanation:    result.explanation || result.modeOutput || '',
  degraded:       result.degraded || false,
});

/* ─── Guaranteed fallback matching full schema ───── */
const fallback = (code, mode) => {
  const base = {
    correctedCode: code,
    explanation:   'AI service is currently unavailable. Please check your GROQ_API_KEY in the backend .env file to enable full AI-powered analysis.',
    mistakes:      [],
    steps:         [],
    tips:          [],
    questions:     [],
    errors:        [],
    suggestions:   [],
    modeOutput:    'Running in offline fallback mode. Configure GROQ_API_KEY for full analysis.',
    degraded:      true,
  };

  if (mode === 'interviewer') {
    base.questions = [
      { question: 'What does this code do at a high level?',             answer: 'Review the code manually to determine its purpose and describe the overall logic flow.',              difficulty: 'easy'   },
      { question: 'What variables or data structures are used?',          answer: 'Identify all variables, arrays, objects, or other data structures present in the code.',             difficulty: 'easy'   },
      { question: 'Are there any potential bugs in this code?',           answer: 'Look for off-by-one errors, null reference issues, or incorrect conditional logic.',                 difficulty: 'medium' },
      { question: 'How would you improve the performance of this code?',  answer: 'Consider algorithmic complexity, unnecessary loops, and opportunities for caching or memoization.',  difficulty: 'medium' },
      { question: 'What security vulnerabilities exist in this code?',    answer: 'Check for injection risks, hardcoded secrets, improper input validation, and insecure data handling.', difficulty: 'hard'  },
      { question: 'How would you refactor this for production use?',      answer: 'Consider error handling, logging, modularity, testability, and adherence to SOLID principles.',      difficulty: 'hard'   },
    ];
  }

  return base;
};

/* ─── Normalize AI output to guaranteed schema ───── */
const normalize = (ai, code, mode) => ({
  correctedCode: typeof ai.correctedCode === 'string' && ai.correctedCode.trim() ? ai.correctedCode : code,
  explanation:   typeof ai.explanation   === 'string' && ai.explanation.trim()   ? ai.explanation   : '',
  mistakes:      Array.isArray(ai.mistakes)    ? ai.mistakes    : [],
  steps:         Array.isArray(ai.steps)       ? ai.steps       : [],
  tips:          Array.isArray(ai.tips)        ? ai.tips        : [],
  questions:     Array.isArray(ai.questions)   ? ai.questions   : [],
  errors:        Array.isArray(ai.errors)      ? ai.errors      : [],
  suggestions:   Array.isArray(ai.suggestions) ? ai.suggestions : [],
  modeOutput:    typeof ai.modeOutput === 'string' ? ai.modeOutput : '',
  degraded:      false,
});

/* ─── Main export ────────────────────────────────── */
export const analyzeContent = async (code, mode) => {
  const finalMode = normalizeMode(mode);

  const hasAnyKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!hasAnyKey) {
    return fallback(code, finalMode);
  }

  try {
    const prompt  = buildPrompt(code, finalMode);
    const rawText = await callAI(prompt);
    let   ai      = extractJSON(rawText);

    // Retry once if JSON parse failed
    if (!ai) {
      console.warn('First AI parse failed, retrying...');
      const retryText = await callAI(prompt);
      ai = extractJSON(retryText);
    }

    if (!ai) {
      console.error('AI returned unparseable JSON after retry');
      return fallback(code, finalMode);
    }

    const result = normalize(ai, code, finalMode);

    // Guarantee interviewer always has >= 6 questions
    if (finalMode === 'interviewer' && result.questions.length < 5) {
      result.questions = fallback(code, finalMode).questions;
    }

    return result;
  } catch (err) {
    console.error('AI service error:', err.message);
    return fallback(code, finalMode);
  }
};