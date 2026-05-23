import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

passport.serializeUser((user, done) => done(null, user._id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Lazily initialized sentinel hash
let _oauthPasswordHash = null;
const getOAuthPasswordHash = async () => {
  if (!_oauthPasswordHash) {
    _oauthPasswordHash = await bcrypt.hash('__oauth_placeholder__', 10);
  }
  return _oauthPasswordHash;
};

const findOrCreateOAuthUser = async ({ email, name, avatar = '', githubUser = '', isGoogleUser = false }) => {
  let user = await User.findOne({ email });
  let isNew = false;
  if (!user) {
    const hash = await getOAuthPasswordHash();
    user = new User({ name, email, password: hash, avatar, githubUser, isGoogleUser, isNewUser: true });
    user.$locals.skipPasswordHash = true;
    await user.save();
    isNew = true;
  } else {
    const updates = {};
    if (user.name !== name) updates.name = name;
    if (avatar && user.avatar !== avatar) updates.avatar = avatar;
    if (githubUser && user.githubUser !== githubUser) updates.githubUser = githubUser;
    if (Object.keys(updates).length > 0) {
      Object.assign(user, updates);
      user.$locals.skipPasswordHash = true;
      await user.save();
    }
  }
  user._isNewOAuthUser = isNew;
  return user;
};

// ── Google ────────────────────────────────────────────────────────────────────
// Only register strategy if credentials are properly configured
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (
  googleClientId &&
  googleClientSecret &&
  googleClientId !== 'your_google_client_id_here' &&
  googleClientSecret !== 'your_google_client_secret_here'
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     googleClientId,
        clientSecret: googleClientSecret,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          if (!email) return done(new Error('No email returned from Google'), null);

          const name   = profile.displayName || email.split('@')[0];
          const avatar = profile.photos?.[0]?.value || '';
          const user   = await findOrCreateOAuthUser({ email, name, avatar, isGoogleUser: true });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('[Passport] Google OAuth strategy registered');
} else {
  console.warn('[Passport] Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}

// ── GitHub ────────────────────────────────────────────────────────────────────
const githubClientId     = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

const isGithubPlaceholder = (v) =>
  !v ||
  v.startsWith('your_') ||
  v.startsWith('YOUR_') ||
  v.startsWith('PASTE_') ||
  v.toLowerCase().includes('placeholder') ||
  v.toLowerCase().includes('your_real') ||
  v === 'your_github_client_id_here' ||
  v === 'your_github_client_secret_here';

if (!isGithubPlaceholder(githubClientId) && !isGithubPlaceholder(githubClientSecret)) {
  passport.use(
    new GitHubStrategy(
      {
        clientID:     githubClientId,
        clientSecret: githubClientSecret,
        callbackURL:  process.env.GITHUB_CALLBACK_URL ||
                      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
        scope:        ['user:email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const rawEmail = profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;
          const email      = rawEmail.toLowerCase().trim();
          const name       = profile.displayName || profile.username || email.split('@')[0];
          const githubUser = profile.username || '';
          const avatar     = profile.photos?.[0]?.value || '';

          const user = await findOrCreateOAuthUser({ email, name, avatar, githubUser });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('[Passport] GitHub OAuth strategy registered');
} else {
  console.warn('[Passport] GitHub OAuth not configured — set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env');
}

export default passport;
