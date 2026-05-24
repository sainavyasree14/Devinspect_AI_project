import express from 'express';
import User from '../models/User.js';
import groqService from '../services/groqService.js';

const router = express.Router();

// Simple in-memory rate limiter (30 req/min per IP)
const rateLimitMap = new Map();
const vscodeLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > 30) return res.status(429).json({ error: 'Too many requests, please slow down.' });
  next();
};

// Middleware: authenticate via devToken header
const authenticateDevToken = async (req, res, next) => {
  const token = req.headers['x-api-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing API token' });

  const user = await User.findOne({ devToken: token }).select('-password');
  if (!user) return res.status(401).json({ error: 'Invalid or expired API token' });

  req.user = user;
  next();
};

// POST /api/vscode/verify-token
router.post('/verify-token', vscodeLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ valid: false, error: 'Token required' });

    const user = await User.findOne({ devToken: token }).select('name email devTokenCreatedAt');
    if (!user) return res.status(401).json({ valid: false, error: 'Invalid token' });

    res.json({
      valid: true,
      user: { name: user.name, email: user.email },
      tokenCreatedAt: user.devTokenCreatedAt,
    });
  } catch {
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// POST /api/vscode/connect
router.post('/connect', vscodeLimiter, authenticateDevToken, (req, res) => {
  res.json({
    connected: true,
    message: `Connected as ${req.user.name}`,
    user: { name: req.user.name, email: req.user.email },
  });
});

// POST /api/vscode/analyze
router.post('/analyze', vscodeLimiter, authenticateDevToken, async (req, res) => {
  try {
    const { code, language = 'unknown', fileName = '' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code field is required' });
    }
    if (code.length > 50000) {
      return res.status(400).json({ error: 'Code exceeds 50,000 character limit' });
    }

    const prompt = `You are an expert code reviewer. Analyze the following ${language} code and return ONLY a strict JSON object with this exact structure:
{
  "score": <integer 0-100>,
  "language": "<detected language>",
  "summary": "<one sentence summary>",
  "bugs": [{ "line": <number or null>, "severity": "high|medium|low", "message": "<description>" }],
  "security": [{ "line": <number or null>, "severity": "high|medium|low", "message": "<description>" }],
  "quality": [{ "line": <number or null>, "severity": "high|medium|low", "message": "<description>" }],
  "suggestions": ["<actionable suggestion>"],
  "explanation": "<brief AI explanation of the code>"
}

File: ${fileName || 'unknown'}
Language hint: ${language}

Code:
\`\`\`
${code.slice(0, 8000)}
\`\`\``;

    const raw = await groqService(prompt);

    let result;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      result = {
        score: 70,
        language,
        summary: 'Analysis completed.',
        bugs: [],
        security: [],
        quality: [],
        suggestions: ['Review code manually for best results.'],
        explanation: raw || 'AI analysis completed.',
      };
    }

    res.json({ success: true, analysis: result });
  } catch (err) {
    console.error('[VSCode Analyze]', err.message);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

export default router;
