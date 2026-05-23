import User from '../models/User.js';
import Analysis from '../models/Analysis.js';
import Workspace from '../models/Workspace.js';
import crypto from 'crypto';

// ── GET /api/user/profile ─────────────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const allowed = ['name', 'currentMode', 'githubUser', 'githubToken'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    }

    if (req.body.password) user.password = req.body.password;

    if (req.body.generateApiKey) {
      user.apiKey = crypto.randomBytes(24).toString('hex');
    }

    const updated = await user.save();

    res.json({
      _id:         updated._id,
      name:        updated.name,
      email:       updated.email,
      role:        updated.role,
      currentMode: updated.currentMode,
      customRules: updated.customRules,
      preferences: updated.preferences,
      apiKey:      updated.apiKey,
      githubUser:  updated.githubUser,
      createdAt:   updated.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── PUT /api/user/preferences ─────────────────────────────────────────────────
export const updateUserPreferences = async (req, res) => {
  try {
    const { defaultLanguage, themePreference, notificationsEnabled, uiLanguage } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.preferences) user.preferences = {};
    if (defaultLanguage      !== undefined) user.preferences.defaultLanguage      = defaultLanguage;
    if (themePreference      !== undefined) user.preferences.themePreference      = themePreference;
    if (notificationsEnabled !== undefined) user.preferences.notificationsEnabled = notificationsEnabled;
    if (uiLanguage           !== undefined) user.preferences.uiLanguage           = uiLanguage;

    user.markModified('preferences');
    await user.save();

    res.json({ message: 'Preferences saved', preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── PUT /api/user/rules ───────────────────────────────────────────────────────
export const updateUserRules = async (req, res) => {
  try {
    const { customRules } = req.body;

    if (!Array.isArray(customRules)) {
      return res.status(400).json({ message: 'customRules must be an array' });
    }

    // Normalize: accept both string[] and object[]
    const normalized = customRules.map((r) => {
      if (typeof r === 'string') return { text: r, category: 'general', enabled: true };
      return {
        text:     String(r.text || '').trim(),
        category: r.category || 'general',
        enabled:  r.enabled !== false,
      };
    }).filter((r) => r.text.length > 0);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { customRules: normalized } },
      { new: true, select: 'customRules' }
    );

    res.json({ message: 'Rules saved', customRules: user.customRules });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── GET /api/user/settings ────────────────────────────────────────────────────
export const getUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('customRules preferences apiKey');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      customRules: user.customRules || [],
      preferences: user.preferences || {},
      apiKey:      user.apiKey || '',
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/user/dev-token ──────────────────────────────────────────────────
export const generateDevToken = async (req, res) => {
  try {
    const devToken = `dvi_${crypto.randomBytes(24).toString('hex')}`;
    await User.findByIdAndUpdate(req.user._id, { $set: { apiKey: devToken } });
    res.json({ devToken });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/user/avatar ─────────────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    // If multer/cloudinary is configured, req.file will be set
    // For now, accept base64 in body as fallback
    const avatarUrl = req.body.avatarUrl || req.file?.path || '';
    if (!avatarUrl) return res.status(400).json({ message: 'No avatar provided' });

    await User.findByIdAndUpdate(req.user._id, { $set: { avatarUrl } });
    res.json({ avatarUrl });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/user/profile ──────────────────────────────────────────────────
export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    await Analysis.deleteMany({ user: userId });
    await Workspace.updateMany({ members: userId }, { $pull: { members: userId } });
    await Workspace.deleteMany({ owner: userId });
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
