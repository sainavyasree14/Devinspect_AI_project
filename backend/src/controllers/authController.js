import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService.js';

const tokenPayload = (user) => ({
  email:       user.email,
  name:        user.name,
  role:        user.role        || 'user',
  currentMode: user.currentMode || 'developer',
});

// ── Register ──────────────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    console.log('[Register] Body received:', { name: req.body.name, email: req.body.email, hasPassword: !!req.body.password });

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[Register] Checking for existing user:', normalizedEmail);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      console.log('[Register] Email already exists');
      return res.status(409).json({ message: 'Email already registered' });
    }

    console.log('[Register] Creating user...');
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
    console.log('[Register] User created — id:', user._id);

    // Non-fatal activity log
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      await user.logActivity('register', 'Account created', ip);
    } catch (e) {
      console.warn('[Register] logActivity failed (non-fatal):', e.message);
    }

    const token = generateToken(user._id, tokenPayload(user));
    console.log('[Register] Token generated — responding 201');

    return res.status(201).json({
      _id:         user._id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      currentMode: user.currentMode,
      token,
    });
  } catch (err) {
    console.error('[Register] Error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: field === 'email' ? 'Email already registered' : `Duplicate ${field}` });
    }
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msg || 'Validation error' });
    }
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    console.log('[Login] Attempt for:', req.body.email);

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('[Login] User not found:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('[Login] User found — id:', user._id, '| checking password...');
    const valid = await user.matchPassword(password);
    console.log('[Login] Password valid:', valid);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    try {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      await user.logActivity('login', `Login from ${ip || 'unknown'}`, ip);
    } catch (e) {
      console.warn('[Login] logActivity failed (non-fatal):', e.message);
    }

    const token = generateToken(user._id, tokenPayload(user));
    console.log('[Login] Success — token generated');

    return res.json({
      _id:         user._id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      currentMode: user.currentMode,
      lastLogin:   user.lastLogin,
      token,
    });
  } catch (err) {
    console.error('[Login] Error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Always 200 to prevent email enumeration
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.$locals.skipPasswordHash = true;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;
    console.log('[ForgotPassword] Reset URL:', resetUrl);
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[ForgotPassword] Error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password             = password; // pre-save hook hashes it
    user.resetPasswordToken   = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log('[ResetPassword] Password reset for:', user.email);
    return res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('[ResetPassword] Error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
