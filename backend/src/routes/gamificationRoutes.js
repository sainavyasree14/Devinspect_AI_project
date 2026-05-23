import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Analysis from '../models/Analysis.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/gamification/leaderboard
 * Returns top 20 users ranked by total analyses + avg score
 */
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const agg = await Analysis.aggregate([
      {
        $group: {
          _id:           '$userId',
          totalAnalyses: { $sum: 1 },
          avgScore:      { $avg: '$aiScore' },
          totalIssues:   { $sum: { $size: { $ifNull: ['$errors', []] } } },
          lastActive:    { $max: '$createdAt' },
        },
      },
      { $sort: { totalAnalyses: -1, avgScore: -1 } },
      { $limit: 20 },
    ]);

    // Populate user names/avatars
    const userIds = agg.map(a => a._id).filter(Boolean);
    const users   = await User.find({ _id: { $in: userIds } }).select('name avatar email').lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const leaderboard = agg.map((entry, idx) => {
      const user = userMap[String(entry._id)] || {};
      return {
        rank:          idx + 1,
        userId:        entry._id,
        name:          user.name  || 'Anonymous',
        avatar:        user.avatar || '',
        totalAnalyses: entry.totalAnalyses,
        avgScore:      Math.round(entry.avgScore || 0),
        totalIssues:   entry.totalIssues,
        lastActive:    entry.lastActive,
        xp:            entry.totalAnalyses * 10 + Math.round((entry.avgScore || 0) / 10),
      };
    });

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('[Gamification] Leaderboard error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/gamification/my-stats
 * Returns current user's gamification stats
 */
router.get('/my-stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const analyses = await Analysis.find({ userId }).lean();

    const totalAnalyses = analyses.length;
    const avgScore      = totalAnalyses
      ? Math.round(analyses.reduce((s, a) => s + (a.aiScore || 0), 0) / totalAnalyses)
      : 0;
    const totalIssues   = analyses.reduce((s, a) => s + (a.errors?.length || 0), 0);
    const criticalCount = analyses.reduce((s, a) =>
      s + (a.errors?.filter(e => String(e.severity || '').toLowerCase().includes('critical')).length || 0), 0);

    res.json({
      success: true,
      stats: { totalAnalyses, avgScore, totalIssues, criticalCount, xp: totalAnalyses * 10 + Math.round(avgScore / 10) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
