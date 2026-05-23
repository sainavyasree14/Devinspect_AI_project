import Analysis from '../models/Analysis.js';
import { analyzeContent, normalizeMode } from '../services/aiService.js';

/* ─── Normalize raw AI result to full schema ─────── */
const normalizeResult = (raw, code) => ({
  correctedCode: raw.correctedCode || code,
  explanation:   raw.explanation   || '',
  errors:        Array.isArray(raw.errors)      ? raw.errors      : [],
  suggestions:   Array.isArray(raw.suggestions) ? raw.suggestions : [],
  questions:     Array.isArray(raw.questions)   ? raw.questions   : [],
  mistakes:      Array.isArray(raw.mistakes)    ? raw.mistakes    : [],
  steps:         Array.isArray(raw.steps)       ? raw.steps       : [],
  tips:          Array.isArray(raw.tips)        ? raw.tips        : [],
  modeOutput:    raw.modeOutput || '',
  degraded:      Boolean(raw.degraded),
});

/* ─── Compute AI score from errors ───────────────── */
const computeScore = (errors = []) => {
  let score = 100;
  errors.forEach(e => {
    const sev = String(e.severity || '').toLowerCase();
    if (sev.includes('critical')) score -= 25;
    else if (sev.includes('high')) score -= 15;
    else if (sev.includes('medium')) score -= 8;
    else score -= 3;
  });
  return Math.max(0, Math.min(100, score));
};

/* ─── POST /api/analysis ──────────────────────────── */
export const runAnalysis = async (req, res) => {
  try {
    const { text, mode, language, workspaceId } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Code text is required' });
    }

    const finalMode = normalizeMode(mode);
    const finalLang = language || 'javascript';

    const raw    = await analyzeContent(text, finalMode);
    const result = normalizeResult(raw, text);

    const saved = await Analysis.create({
      user:      req.user._id,
      workspace: workspaceId || undefined,
      inputText: text,
      result,
      mode:      finalMode,
      language:  finalLang,
    });

    res.status(201).json({
      success:   true,
      _id:       saved._id,
      result,
      mode:      finalMode,
      language:  finalLang,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ─── GET /api/analysis ───────────────────────────── */
export const getAnalyses = async (req, res) => {
  try {
    const data = await Analysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── DELETE /api/analysis/:id ────────────────────── */
export const deleteAnalysis = async (req, res) => {
  try {
    await Analysis.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── DELETE /api/analysis (clear all) ───────────── */
export const clearAllAnalyses = async (req, res) => {
  try {
    const r = await Analysis.deleteMany({ user: req.user._id });
    res.json({ success: true, deletedCount: r.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── PUT /api/analysis/:id/bookmark ─────────────── */
export const toggleBookmark = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
    if (!analysis) return res.status(404).json({ message: 'Not found' });

    analysis.isBookmarked = !analysis.isBookmarked;
    await analysis.save();

    res.json({ isBookmarked: analysis.isBookmarked, _id: analysis._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};