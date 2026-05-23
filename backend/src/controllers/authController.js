import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const tokenPayload = (user) => ({
  email:       user.email,
  name:        user.name,
  role:        user.role,
  currentMode: user.currentMode,
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });

    try {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      await user.logActivity('register', 'Account created', ip);
    } catch (logErr) {
      console.warn('logActivity failed (non-fatal):', logErr.message);
    }

    const token = generateToken(user._id, tokenPayload(user));

    res.status(201).json({
      _id:         user._id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      currentMode: user.currentMode,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      const message = field === 'email' ? 'Email already exists' : `Duplicate value for ${field}`;
      return res.status(409).json({ message });
    }
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msg || 'Invalid input' });
    }

    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Normalize before lookup — matches how emails are stored
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    try {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      await user.logActivity('login', `Login from ${ip || 'unknown'}`, ip);
    } catch (logErr) {
      console.warn('logActivity failed (non-fatal):', logErr.message);
    }

    const token = generateToken(user._id, tokenPayload(user));

    res.json({
      _id:         user._id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      currentMode: user.currentMode,
      lastLogin:   user.lastLogin,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};