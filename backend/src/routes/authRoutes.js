import express from 'express';
import passport from '../config/passport.js';
import { registerUser, loginUser } from '../controllers/authController.js';
import { oauthCallback } from '../controllers/oauthController.js';

const router = express.Router();

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Email / Password ──────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/login',    loginUser);

// ── Google OAuth ──────────────────────────────────────────────────────────────
const googleConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

router.get('/google', (req, res, next) => {
  if (!googleConfigured) {
    return res.redirect(`${FRONTEND}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!googleConfigured) {
      return res.redirect(`${FRONTEND}/login?error=google_not_configured`);
    }
    passport.authenticate('google', {
      failureRedirect: `${FRONTEND}/login?error=oauth_failed`,
      session: false,
    })(req, res, next);
  },
  oauthCallback
);

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
// Configured = any non-empty, non-placeholder value
const isPlaceholder = (val) =>
  !val ||
  val.startsWith('your_') ||
  val.startsWith('YOUR_') ||
  val.startsWith('PASTE_') ||
  val.toLowerCase().includes('placeholder') ||
  val.toLowerCase().includes('your_real') ||
  val === 'your_github_client_id_here' ||
  val === 'your_github_client_secret_here';

const githubConfigured =
  !isPlaceholder(process.env.GITHUB_CLIENT_ID) &&
  !isPlaceholder(process.env.GITHUB_CLIENT_SECRET);

router.get('/github', (req, res, next) => {
  if (!githubConfigured) {
    return res.redirect(`${FRONTEND}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});

router.get(
  '/github/callback',
  (req, res, next) => {
    if (!githubConfigured) {
      return res.redirect(`${FRONTEND}/login?error=github_not_configured`);
    }
    passport.authenticate('github', {
      failureRedirect: `${FRONTEND}/login?error=oauth_failed`,
      session: false,
    })(req, res, next);
  },
  oauthCallback
);

export default router;
