import express from 'express';
import User from '../models/User.js';
import Analysis from '../models/Analysis.js';
import { analyzeContent } from '../services/aiService.js';

const router = express.Router();

// Middleware to protect CI routes via X-API-Key
const protectCI = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ message: 'Authentication failed. Please provide X-API-Key header.' });
  }

  try {
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed. Invalid API Key.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

router.post('/review', protectCI, async (req, res) => {
  try {
    const { code, mode, language } = req.body;
    if (!code?.trim()) {
      return res.status(400).json({ message: 'Code is required in the body.' });
    }

    const customRules = req.user.customRules || [];
    const aiResponse = await analyzeContent(code, mode, customRules);

    // Save to database
    await Analysis.create({
      user: req.user._id,
      inputText: code,
      result: aiResponse,
      mode: mode || 'developer',
      language: language || 'javascript'
    });

    return res.json({
      success: true,
      analysis: aiResponse
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;