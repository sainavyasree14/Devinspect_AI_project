import express from 'express';
import { analyzeContent } from '../services/aiService.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { code, mode, language } = req.body;
    if (!code?.trim()) return res.status(400).json({ message: 'Missing code' });
    const result = await analyzeContent(code, mode);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;