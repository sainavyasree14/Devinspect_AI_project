import User from '../models/User.js';
import Analysis from '../models/Analysis.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActivities = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email activityLog')
      .lean();

    const activities = [];
    users.forEach(u => {
      (u.activityLog || []).forEach(log => {
        activities.push({
          userId:    u._id,
          userName:  u.name,
          userEmail: u.email,
          action:    log.action,
          detail:    log.detail,
          ip:        log.ip,
          createdAt: log.createdAt,
        });
      });
    });

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(activities.slice(0, 200));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalAnalyses, newUsers, recentAnalyses] = await Promise.all([
      User.countDocuments(),
      Analysis.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Analysis.find({ createdAt: { $gte: sevenDaysAgo } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo },
    });

    const modeStats = await Analysis.aggregate([
      { $group: { _id: '$mode', count: { $sum: 1 } } },
    ]);

    const langStats = await Analysis.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const dailyStats = await Analysis.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalUsers,
      totalAnalyses,
      activeUsers,
      newUsers,
      modeStats,
      langStats,
      dailyStats,
      recentActivity: recentAnalyses.map(a => ({
        _id:       a._id,
        userName:  a.user?.name  || 'Unknown',
        userEmail: a.user?.email || '',
        mode:      a.mode,
        language:  a.language,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = getDashboardStats;

export const deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Analysis.deleteMany({ user: req.params.id });
    res.json({ message: `User ${user.email} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be user or admin' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};