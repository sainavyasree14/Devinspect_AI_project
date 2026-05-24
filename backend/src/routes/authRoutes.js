import express from 'express';
import passport from '../config/passport.js';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { oauthCallback } from '../controllers/oauthController.js';

const router = express.Router();

// ── Helpers (lazy — evaluated at request time, not module load time) ──────────
const getFrontend = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const isPlaceholder = (val) =>
  !val ||
  val.startsWith('your_') ||
  val.startsWith('YOUR_') ||
  val.toLowerCase().includes('placeholder') ||
  val.toLowerCase().includes('your_real');

const isGoogleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  !isPlaceholder(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
  !isPlaceholder(process.env.GOOGLE_CLIENT_SECRET);

const isGithubConfigured = () =>
  Boolean(process.env.GITHUB_CLIENT_ID) &&
  !isPlaceholder(process.env.GITHUB_CLIENT_ID) &&
  Boolean(process.env.GITHUB_CLIENT_SECRET) &&
  !isPlaceholder(process.env.GITHUB_CLIENT_SECRET);

// ── Email / Password ──────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/login',    loginUser);
router.post('/forgot-password',       forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  console.log('[Google OAuth] Initiation — configured:', isGoogleConfigured());
  if (!isGoogleConfigured()) {
    return res.redirect(`${getFrontend()}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
    prompt: 'select_account',
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  console.log('[Google OAuth] Callback hit — query:', req.query);
  if (!isGoogleConfigured()) {
    return res.redirect(`${getFrontend()}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { session: true }, (err, user, info) => {
    console.log('[Google OAuth] authenticate result — err:', err?.message, '| user:', user?.email, '| info:', info);
    if (err) {
      console.error('[Google OAuth] Strategy error:', err);
      return res.redirect(`${getFrontend()}/login?error=oauth_failed`);
    }
    if (!user) {
      console.error('[Google OAuth] No user — info:', info);
      return res.redirect(`${getFrontend()}/login?error=oauth_failed`);
    }
    req.user = user;
    oauthCallback(req, res);
  })(req, res, next);
});

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
router.get('/github', (req, res, next) => {
  console.log('[GitHub OAuth] Initiation — configured:', isGithubConfigured());
  if (!isGithubConfigured()) {
    return res.redirect(`${getFrontend()}/login?error=github_not_configured`);
  }
  passport.authenticate('github', {
    scope: ['user:email'],
    session: true,
  })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  console.log('[GitHub OAuth] Callback hit — query:', req.query);
  if (!isGithubConfigured()) {
    return res.redirect(`${getFrontend()}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { session: true }, (err, user, info) => {
    console.log('[GitHub OAuth] authenticate result — err:', err?.message, '| user:', user?.email, '| info:', info);
    if (err) {
      console.error('[GitHub OAuth] Strategy error:', err);
      return res.redirect(`${getFrontend()}/login?error=oauth_failed`);
    }
    if (!user) {
      console.error('[GitHub OAuth] No user — info:', info);
      return res.redirect(`${getFrontend()}/login?error=oauth_failed`);
    }
    req.user = user;
    oauthCallback(req, res);
  })(req, res, next);
});

export default router;
