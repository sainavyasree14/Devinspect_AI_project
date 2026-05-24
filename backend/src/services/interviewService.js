import groqService from './groqService.js';

const extractJSON = (text) => {
  if (!text) return null;
  try {
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = clean.indexOf('{');
    const end   = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) return JSON.parse(clean.slice(start, end + 1));
    const arrStart = clean.indexOf('[');
    const arrEnd   = clean.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1) return JSON.parse(clean.slice(arrStart, arrEnd + 1));
  } catch { /* fall through */ }
  return null;
};

const QUESTION_TYPES = ['mcq', 'coding', 'bug_finding', 'output_prediction', 'conceptual'];

const ROLE_DOMAIN_MAP = {
  'Frontend Developer':    ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript'],
  'Backend Developer':     ['Node.js', 'Express', 'REST APIs', 'Databases', 'Authentication'],
  'Full Stack Developer':  ['MERN Stack', 'React', 'Node.js', 'MongoDB', 'REST APIs'],
  'AI/ML Engineer':        ['Python', 'Machine Learning', 'NumPy', 'Pandas', 'Algorithms'],
  'Software Engineer':     ['DSA', 'OOPs', 'System Design', 'Algorithms', 'Data Structures'],
  'Student Placement Prep':['DSA', 'OOPs', 'DBMS', 'OS', 'Aptitude'],
};

const FALLBACK_QUESTIONS = {
  mcq: {
    type: 'mcq',
    title: 'JavaScript Closure',
    description: 'What will the following code output?\n\nfor(var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}',
    options: ['0 1 2', '3 3 3', '0 0 0', 'undefined'],
    correctOption: 1,
    explanation: 'var is function-scoped, so all callbacks share the same i which is 3 after the loop.',
    difficulty: 'medium',
    topic: 'JavaScript',
  },
  coding: {
    type: 'coding',
    title: 'Two Sum',
    description: 'Given an array of integers and a target, return indices of two numbers that add up to target.',
    example: 'Input: nums=[2,7,11,15], target=9\nOutput: [0,1]',
    constraints: '2 ≤ nums.length ≤ 10^4\nExactly one valid answer exists',
    expectedComplexity: 'Time: O(n), Space: O(n)',
    hints: ['Use a hash map to store complement values'],
    testCases: [{ input: 'nums=[3,2,4], target=6', output: '[1,2]' }],
    solution: 'function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map[comp] !== undefined) return [map[comp], i];\n    map[nums[i]] = i;\n  }\n}',
    topic: 'DSA',
  },
  bug_finding: {
    type: 'bug_finding',
    title: 'Find the Bug',
    description: 'The following function should return the factorial of n. Find and fix the bug.',
    buggyCode: 'function factorial(n) {\n  if (n === 0) return 0;\n  return n * factorial(n - 1);\n}',
    bug: 'Base case returns 0 instead of 1. factorial(0) should return 1.',
    fixedCode: 'function factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n - 1);\n}',
    topic: 'JavaScript',
  },
  output_prediction: {
    type: 'output_prediction',
    title: 'Predict the Output',
    description: 'What is the output of the following code?\n\nconsole.log(typeof null);\nconsole.log(null instanceof Object);',
    options: ['"object" true', '"null" false', '"object" false', '"undefined" false'],
    correctOption: 2,
    explanation: 'typeof null is "object" (historical JS bug). null instanceof Object is false because null has no prototype chain.',
    topic: 'JavaScript',
  },
  conceptual: {
    type: 'conceptual',
    title: 'Explain Event Loop',
    description: 'Explain the JavaScript Event Loop and how it handles asynchronous operations.',
    keyPoints: ['Call stack', 'Web APIs', 'Callback queue', 'Microtask queue', 'Event loop cycle'],
    sampleAnswer: 'The event loop continuously checks if the call stack is empty. If so, it moves callbacks from the queue to the stack. Microtasks (Promises) have priority over macrotasks (setTimeout).',
    topic: 'JavaScript',
  },
};

/* ─── Generate full interview session (7-8 questions) ─── */
export const generateInterviewSession = async ({ role, domain, language, difficulty, count = 8 }) => {
  const total = Math.min(Math.max(Number(count), 7), 8);
  const topics = ROLE_DOMAIN_MAP[role] || ROLE_DOMAIN_MAP['Software Engineer'];
  const focusDomain = domain || topics[0];

  const typeDistribution = ['mcq', 'coding', 'bug_finding', 'output_prediction', 'conceptual', 'coding', 'mcq', 'conceptual'];
  const types = typeDistribution.slice(0, total);

  const prompt = `You are a senior technical interviewer conducting a ${difficulty} level mock interview.

Role: ${role || 'Software Engineer'}
Domain/Stack: ${focusDomain}
Language: ${language || 'JavaScript'}
Difficulty: ${difficulty}

Generate exactly ${total} interview questions as a JSON array. Each question must be relevant to the role and domain.

Question types to generate (in this order): ${types.join(', ')}

For each question type, use this exact structure:

MCQ / output_prediction:
{
  "type": "mcq" | "output_prediction",
  "title": "short title",
  "description": "question text or code snippet",
  "options": ["A", "B", "C", "D"],
  "correctOption": 0,
  "explanation": "why this answer is correct",
  "topic": "topic name",
  "difficulty": "${difficulty}"
}

coding:
{
  "type": "coding",
  "title": "problem title",
  "description": "problem statement",
  "example": "Input: ...\\nOutput: ...",
  "constraints": "constraints",
  "expectedComplexity": "Time: O(?), Space: O(?)",
  "hints": ["hint1"],
  "testCases": [{"input": "...", "output": "..."}],
  "solution": "complete working solution code",
  "explanation": "step by step explanation",
  "topic": "topic name",
  "difficulty": "${difficulty}"
}

bug_finding:
{
  "type": "bug_finding",
  "title": "Find the Bug",
  "description": "description of what the code should do",
  "buggyCode": "code with bug",
  "bug": "description of the bug",
  "fixedCode": "corrected code",
  "topic": "topic name",
  "difficulty": "${difficulty}"
}

conceptual:
{
  "type": "conceptual",
  "title": "concept title",
  "description": "question asking to explain a concept",
  "keyPoints": ["point1", "point2", "point3"],
  "sampleAnswer": "ideal answer in 3-4 sentences",
  "topic": "topic name",
  "difficulty": "${difficulty}"
}

Return ONLY a valid JSON array with exactly ${total} questions. No markdown, no extra text.`;

  try {
    const raw = await groqService(prompt);
    const parsed = extractJSON(raw);
    if (Array.isArray(parsed) && parsed.length >= 5) {
      return parsed.slice(0, total).map((q, i) => ({ ...q, id: `q_${Date.now()}_${i}` }));
    }
  } catch (err) {
    console.error('[InterviewService] Session generation failed:', err.message);
  }

  // Fallback: build from static bank
  return types.map((type, i) => ({
    ...FALLBACK_QUESTIONS[type],
    id: `fallback_${i}`,
    difficulty,
  }));
};

/* ─── Normalize evaluation to required shape ─── */
const normalizeEvaluation = (raw, userCode, question, fallbackScore = 50) => {
  // Score: clamp strictly between 0-100, always a valid number
  const rawScore = typeof raw.score === 'number' && !isNaN(raw.score) ? raw.score : fallbackScore;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const correctCode =
    raw.correctCode ||
    raw.betterAnswer ||
    question?.solution ||
    question?.fixedCode ||
    question?.sampleAnswer ||
    'Not available';

  const mistakes = Array.isArray(raw.mistakes) && raw.mistakes.length > 0
    ? raw.mistakes
    : Array.isArray(raw.weaknesses) && raw.weaknesses.length > 0
    ? raw.weaknesses
    : ['Unable to fully analyze'];

  const deductions = Array.isArray(raw.deductions) && raw.deductions.length > 0
    ? raw.deductions
    : [];

  const feedback = raw.feedback && typeof raw.feedback === 'string' && raw.feedback.trim()
    ? raw.feedback.trim()
    : 'Partial evaluation due to missing response';

  const breakdown = raw.breakdown && typeof raw.breakdown === 'object'
    ? {
        correctness:  Math.max(0, Math.min(40, Number(raw.breakdown.correctness)  || 0)),
        quality:      Math.max(0, Math.min(30, Number(raw.breakdown.quality)       || 0)),
        completeness: Math.max(0, Math.min(30, Number(raw.breakdown.completeness)  || 0)),
      }
    : {
        correctness:  Math.round(score * 0.4),
        quality:      Math.round(score * 0.3),
        completeness: Math.round(score * 0.3),
      };

  return {
    userCode:        userCode || '',
    correctCode,
    score,
    passed:          score >= 60,
    correct:         raw.correct ?? score >= 60,
    mistakes,
    deductions,
    feedback,
    strengths:       Array.isArray(raw.strengths) ? raw.strengths : [],
    breakdown,
    timeComplexity:  raw.timeComplexity  || question?.expectedComplexity?.split(',')[0]?.trim() || 'N/A',
    spaceComplexity: raw.spaceComplexity || question?.expectedComplexity?.split(',')[1]?.trim() || 'N/A',
    explanation:     raw.explanation     || question?.explanation || '',
  };
};

/* ─── Evaluate a single answer ─── */
export const evaluateAnswer = async (question, answer, timeSpent) => {
  const userCode = answer || '';

  if (!userCode.trim() || userCode.trim().length < 3) {
    return normalizeEvaluation(
      { score: 0, feedback: 'No answer provided.', mistakes: ['No answer was submitted'], correct: false },
      userCode, question, 0
    );
  }

  // MCQ / output_prediction — deterministic scoring
  if (question.type === 'mcq' || question.type === 'output_prediction') {
    const correct = String(userCode).trim() === String(question.correctOption);
    const timeBonus = timeSpent < 30 ? 5 : timeSpent < 60 ? 3 : 0;
    const score = correct ? Math.min(100, 85 + timeBonus) : 0;
    const correctOptionText = question.options?.[question.correctOption] ?? `Option ${question.correctOption}`;
    return normalizeEvaluation(
      {
        score,
        correct,
        feedback: correct
          ? `Correct! ${question.explanation || ''}`
          : `Incorrect. The correct answer is: "${correctOptionText}". ${question.explanation || ''}`,
        mistakes: correct ? [] : [`Selected wrong option. Correct answer: "${correctOptionText}"`],
        correctCode: correctOptionText,
        breakdown: { correctness: correct ? 40 : 0, quality: correct ? 30 : 0, completeness: correct ? 30 : 0 },
      },
      userCode, question, score
    );
  }

  // Coding / bug_finding / conceptual — AI evaluation
  const stripped = userCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (stripped.length < 10) {
    return normalizeEvaluation(
      { score: 0, feedback: 'Answer too short to evaluate.', mistakes: ['Answer is too short or only contains comments'], correct: false },
      userCode, question, 0
    );
  }

  const correctCodeHint = question.solution || question.fixedCode || question.sampleAnswer || '';

  const prompt = `You are a strict technical interviewer. Evaluate this candidate answer using DEDUCTION-BASED scoring.

Question Type: ${question.type}
Question Title: ${question.title}
Question: ${question.description}
${question.type === 'coding' ? `Expected Complexity: ${question.expectedComplexity || 'optimal'}` : ''}
${question.type === 'bug_finding' ? `The bug is: ${question.bug}\nFixed code: ${question.fixedCode || ''}` : ''}
${question.type === 'conceptual' ? `Key points expected: ${(question.keyPoints || []).join(', ')}` : ''}
${correctCodeHint ? `Correct/Ideal Answer:\n${correctCodeHint}` : ''}

Candidate Answer:
${userCode}

Time spent: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s

SCORING RULES — Start at 100, deduct points:
- Syntax error found: deduct 20
- Logic error found: deduct 30
- Wrong output / incorrect result: deduct 25
- Inefficient algorithm (when better exists): deduct 10 to 20
- Missing edge cases: deduct 10
- Score floor is 0, ceiling is 100
- If answer is completely wrong or empty logic: score must be 0-15
- If answer is fully correct and optimal: score must be 85-100

For "deductions" field, list each deduction as: "<reason>: -<points>"

Return ONLY valid JSON, no markdown:
{
  "score": <0-100>,
  "correct": <true|false>,
  "feedback": "<2-3 sentences as a real interviewer speaking to the candidate>",
  "mistakes": ["<specific mistake 1>", "<specific mistake 2>"],
  "deductions": ["Syntax error: -20", "Logic error: -30"],
  "correctCode": "<the complete correct/optimal solution or answer>",
  "strengths": ["<what candidate did well>"],
  "breakdown": {
    "correctness": <0-40>,
    "quality": <0-30>,
    "completeness": <0-30>
  },
  "timeComplexity": "<O(?) of submitted answer>",
  "spaceComplexity": "<O(?) of submitted answer>",
  "explanation": "<step-by-step explanation of the correct approach>"
}`;

  try {
    const raw = await groqService(prompt);
    const parsed = extractJSON(raw);
    if (parsed && typeof parsed.score === 'number') {
      return normalizeEvaluation(parsed, userCode, question);
    }
  } catch (err) {
    console.error('[InterviewService] Evaluation failed:', err.message);
  }

  // Offline fallback — never return undefined fields
  const hasContent = stripped.length > 30;
  return normalizeEvaluation(
    {
      score: hasContent ? 50 : 10,
      correct: false,
      feedback: 'Partial evaluation due to missing response',
      mistakes: ['Unable to fully analyze — AI service unavailable'],
      strengths: hasContent ? ['Answer has meaningful content'] : [],
    },
    userCode, question, hasContent ? 50 : 10
  );
};

/* ─── Generate final interview summary ─── */
export const generateInterviewSummary = async (questions, answers, totalTime) => {
  // answers is array of { code, result, skipped } objects from frontend
  const answered   = answers.filter(a => a?.code && !a?.skipped);
  const skipped    = answers.filter(a => a?.skipped);
  const scores     = answers.map(a => a?.result?.score ?? 0);
  const totalScore = scores.reduce((s, v) => s + v, 0);
  const maxScore   = Math.max(questions.length * 100, 100);
  const percentage = Math.round((totalScore / maxScore) * 100);
  const correct    = answers.filter(a => a?.result?.correct === true || (a?.result?.score ?? 0) >= 60).length;
  const wrong      = answered.length - correct;

  const weakTopics = answers
    .filter(a => !a?.skipped && (a?.result?.score ?? 0) < 50)
    .map((a, i) => questions[i]?.title || questions[i]?.topic || `Question ${i + 1}`)
    .filter(Boolean)
    .join(', ') || 'none';

  const prompt = `You are a senior interviewer. Based on this interview performance, provide analysis.

Questions: ${questions.length}
Answered: ${answered.length}
Skipped: ${skipped.length}
Correct: ${correct}
Wrong: ${wrong}
Total Score: ${totalScore}/${maxScore} (${percentage}%)
Total Time: ${Math.floor(totalTime / 60)} minutes
Topics covered: ${[...new Set(questions.map(q => q?.topic).filter(Boolean))].join(', ')}
Weak areas (low scores): ${weakTopics}

Return ONLY valid JSON:
{
  "strengths": ["<3 specific strengths based on performance>"],
  "weaknesses": ["<3 specific weak areas to improve>"],
  "suggestions": ["<3 actionable study suggestions>"],
  "overallFeedback": "<2-3 sentences overall assessment>"
}`;

  try {
    const raw = await groqService(prompt);
    const parsed = extractJSON(raw);
    if (parsed?.strengths) return { ...parsed, totalScore, maxScore, percentage, correct, wrong, skipped: skipped.length };
  } catch (err) {
    console.error('[InterviewService] Summary failed:', err.message);
  }

  return {
    totalScore, maxScore, percentage, correct, wrong, skipped: skipped.length,
    strengths: percentage >= 70 ? ['Good overall performance', 'Answered most questions'] : ['Attempted the interview'],
    weaknesses: ['Review skipped topics', 'Practice more coding problems'],
    suggestions: ['Practice on LeetCode daily', 'Review core concepts', 'Mock interviews weekly'],
    overallFeedback: `You scored ${percentage}%. ${percentage >= 70 ? 'Good performance!' : 'Keep practicing to improve.'}`,
  };
};

// Keep backward compat
export const generateInterviewQuestion = async (difficulty, company, category) => {
  const questions = await generateInterviewSession({ role: 'Software Engineer', domain: category, language: 'JavaScript', difficulty, count: 1 });
  return questions[0];
};

export const evaluateInterviewSolution = async (question, code, difficulty, timeSpent) => {
  return evaluateAnswer({ ...question, type: question.type || 'coding' }, code, timeSpent);
};
