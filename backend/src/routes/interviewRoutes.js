import express from 'express';
import { generateInterviewQuestion, evaluateInterviewSolution } from '../services/interviewService.js';

const router = express.Router();

// GET /api/interview/question?difficulty=medium&company=Google&category=Arrays
router.get('/question', async (req, res) => {
  try {
    const { difficulty = 'medium', company = '', category = '' } = req.query;
    const question = await generateInterviewQuestion(difficulty, company, category);
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/interview/session — generate a batch of N questions
router.post('/session', async (req, res) => {
  try {
    const { difficulty = 'medium', company = '', categories = [], count = 10 } = req.body;
    const total = Math.min(Math.max(Number(count) || 10, 5), 12);

    // Build category rotation — if none specified use all
    const ALL_CATS = [
      'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Dynamic Programming',
      'JavaScript', 'React', 'Node.js', 'SQL', 'System Design', 'OOPs', 'Recursion',
    ];
    const pool = categories.length > 0 ? categories : ALL_CATS;

    // Generate questions in parallel with staggered categories
    const promises = Array.from({ length: total }, (_, i) => {
      const cat = pool[i % pool.length];
      return generateInterviewQuestion(difficulty, company, cat).catch(() =>
        generateInterviewQuestion(difficulty, '', cat)
      );
    });

    const questions = await Promise.all(promises);
    // Deduplicate by title
    const seen = new Set();
    const unique = questions.filter(q => {
      if (seen.has(q.title)) return false;
      seen.add(q.title);
      return true;
    });

    res.json({ success: true, questions: unique });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/interview/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    const { question, code, difficulty = 'medium', timeSpent = 0 } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Empty answer guard — enforced on backend too
    const trimmed = (code || '').trim().replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!trimmed || trimmed.length < 10) {
      return res.json({
        success: true,
        result: {
          score: 0,
          passed: false,
          breakdown: { correctness: 0, codeQuality: 0, edgeCases: 0, optimization: 0, syntaxValidity: 0 },
          strengths: [],
          weaknesses: ['No solution provided'],
          improvements: ['Write at least a brute-force solution before submitting'],
          feedback: 'Empty submission. Please write your solution and try again.',
          timeComplexity: 'N/A',
          spaceComplexity: 'N/A',
          expectedSolution: question.expectedComplexity || 'See hints',
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
