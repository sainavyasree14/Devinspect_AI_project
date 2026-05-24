import express from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import User from '../models/User.js';
import Analysis from '../models/Analysis.js';
import { analyzeContent, toCIResponse } from '../services/aiService.js';

const router = express.Router();

// ── In-memory rate limiter (60 req/min per IP) ────────────────────────────────
const _rateMap = new Map();
const ciRateLimit = (req, res, next) => {
  const ip  = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const e   = _rateMap.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > e.resetAt) { e.count = 0; e.resetAt = now + 60_000; }
  e.count++;
  _rateMap.set(ip, e);
  if (e.count > 60) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded. Max 60 requests/minute.' });
  }
  next();
};

// ── X-API-Key authentication middleware ───────────────────────────────────────
const protectCI = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'Missing X-API-Key header.' });
  }
  try {
    // Support both devToken (VS Code) and apiKey (CI/CD) fields
    const user = await User.findOne({ $or: [{ apiKey }, { devToken: apiKey }] }).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid API key.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(500).json({ success: false, error: 'Authentication error.' });
  }
};

// ── Webhook dispatcher (fire-and-forget) ─────────────────────────────────────
const dispatchWebhook = (webhookUrl, payload) => {
  if (!webhookUrl) return;
  try {
    const parsed  = new URL(webhookUrl);
    const body    = JSON.stringify(payload);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const req     = lib.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path:     parsed.pathname + parsed.search,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'X-Source': 'devinspectai' },
      },
      (res) => { res.resume(); } // drain response
    );
    req.on('error', (err) => console.warn('[Webhook] Dispatch failed:', err.message));
    req.write(body);
    req.end();
  } catch (err) {
    console.warn('[Webhook] Invalid URL:', err.message);
  }
};

// ── POST /api/ci/review ───────────────────────────────────────────────────────
router.post('/review', ciRateLimit, protectCI, async (req, res) => {
  const { code, mode, language, webhookUrl } = req.body;

  // Payload validation
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, error: 'code field is required and must be a non-empty string.' });
  }
  if (code.length > 100_000) {
    return res.status(400).json({ success: false, error: 'code exceeds 100,000 character limit.' });
  }

  try {
    const customRules = req.user.customRules || [];
    const fullResult  = await analyzeContent(code, mode, customRules);
    const ciResult    = toCIResponse(fullResult);

    // Persist to DB
    await Analysis.create({
      user:      req.user._id,
      inputText: code,
      result:    fullResult,
      mode:      mode || 'developer',
      language:  language || 'unknown',
    });

    const responsePayload = {
      success:  true,
      source:   'ci',
      language: language || 'unknown',
      mode:     mode || 'developer',
      analysis: ciResult,
    };

    // Fire webhook if provided
    dispatchWebhook(webhookUrl || req.user.webhookUrl, responsePayload);

    return res.json(responsePayload);
  } catch (err) {
    console.error('[CI Review]', err.message);
    return res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' });
  }
});

// ── GET /api/ci/health ────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    engines: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      groq:   Boolean(process.env.GROQ_API_KEY),
    },
  });
});

export default router;
