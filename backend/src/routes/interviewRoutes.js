import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateInterviewSession,
  evaluateAnswer,
  generateInterviewSummary,
  generateInterviewQuestion,
  evaluateInterviewSolution,
} from '../services/interviewService.js';
import InterviewSession from '../models/InterviewSession.js';

const router = express.Router();

/* ── POST /api/interview/start — generate 7-8 questions ── */
router.post('/start', protect, async (req, res) => {
  try {
    const { role = 'Software Engineer', domain = '', language = 'JavaScript', difficulty = 'medium', count = 8 } = req.body;
    const questions = await generateInterviewSession({ role, domain, language, difficulty, count });

    const session = await InterviewSession.create({
      user: req.user._id,
      role, domain, language, difficulty,
      questions,
      answers: [],
    });

    res.json({ success: true, sessionId: session._id, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/interview/evaluate-answer — evaluate one answer ── */
router.post('/evaluate-answer', protect, async (req, res) => {
  try {
    const { question, answer, timeSpent = 0 } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question required' });

    const evaluation = await evaluateAnswer(question, answer || '', timeSpent);
    res.json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/interview/finish — save session + generate summary ── */
router.post('/finish', protect, async (req, res) => {
  try {
    const { sessionId, answers, totalTime = 0 } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });

    const session = await InterviewSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const summary = await generateInterviewSummary(session.questions, answers, totalTime);

    session.answers    = answers;
    session.totalScore = summary.totalScore;
    session.maxScore   = summary.maxScore;
    session.percentage = summary.percentage;
    session.correct    = summary.correct;
    session.wrong      = summary.wrong;
    session.skipped    = summary.skipped;
    session.totalTime  = totalTime;
    session.strengths  = summary.strengths;
    session.weaknesses = summary.weaknesses;
    session.suggestions= summary.suggestions;
    session.completed  = true;
    await session.save();

    res.json({ success: true, summary: { ...summary, overallFeedback: summary.overallFeedback } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/interview/history — user's past sessions ── */
router.get('/history', protect, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id, completed: true })
      .select('-questions -answers')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── Backward-compat routes ── */
router.get('/question', async (req, res) => {
  try {
    const { difficulty = 'medium', company = '', category = '' } = req.query;
    const question = await generateInterviewQuestion(difficulty, company, category);
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/session', async (req, res) => {
  try {
    const { difficulty = 'medium', role = 'Software Engineer', domain = '', language = 'JavaScript', count = 8 } = req.body;
    const questions = await generateInterviewSession({ role, domain, language, difficulty, count });
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/evaluate', async (req, res) => {
  try {
    const { question, code, difficulty = 'medium', timeSpent = 0 } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question is required' });

    const trimmed = (code || '').trim().replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!trimmed || trimmed.length < 10) {
      return res.json({
        success: true,
        result: {
          userCode: code || '',
          correctCode: question.solution || question.fixedCode || question.sampleAnswer || 'Not available',
          score: 0,
          passed: false,
          correct: false,
          mistakes: ['No meaningful code was submitted'],
          feedback: 'Empty submission. Please write your solution and try again.',
          strengths: [],
          breakdown: { correctness: 0, quality: 0, completeness: 0 },
          timeComplexity: 'N/A',
          spaceComplexity: 'N/A',
          explanation: '',
        },
      });
    }

    const result = await evaluateInterviewSolution(question, code, difficulty, timeSpent);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
