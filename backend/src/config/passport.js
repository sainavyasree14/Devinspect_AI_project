import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// ── Serialize / Deserialize ───────────────────────────────────────────────────
passport.serializeUser((user, done) => {
  console.log('[Passport] serializeUser — id:', user._id);
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('[Passport] deserializeUser — found:', user?.email);
    done(null, user);
  } catch (err) {
    console.error('[Passport] deserializeUser error:', err.message);
    done(err, null);
  }
});

// ── OAuth user upsert ─────────────────────────────────────────────────────────
let _oauthHash = null;
const getOAuthHash = async () => {
  if (!_oauthHash) _oauthHash = await bcrypt.hash('__oauth__', 10);
  return _oauthHash;
};

const findOrCreateOAuthUser = async ({ email, name, avatar = '', githubUser = '', isGoogleUser = false }) => {
  console.log('[OAuth] findOrCreate — email:', email);

  let user = await User.findOne({ email });
  let isNew = false;

  if (!user) {
    console.log('[OAuth] Creating new user:', email);
    const hash = await getOAuthHash();
    user = new User({ name, email, password: hash, avatar, githubUser, isGoogleUser, isNewUser: true });
    user.$locals.skipPasswordHash = true;
    await user.save();
    isNew = true;
    console.log('[OAuth] New user saved — id:', user._id);
  } else {
    console.log('[OAuth] Existing user found — id:', user._id);
    const updates = {};
    if (name && user.name !== name) updates.name = name;
    if (avatar && user.avatar !== avatar) updates.avatar = avatar;
    if (githubUser && user.githubUser !== githubUser) updates.githubUser = githubUser;
    if (isGoogleUser && !user.isGoogleUser) updates.isGoogleUser = true;
    if (Object.keys(updates).length > 0) {
      Object.assign(user, updates);
      user.$locals.skipPasswordHash = true;
      await user.save();
      console.log('[OAuth] User updated:', updates);
    }
  }

  user._isNewOAuthUser = isNew;
  return user;
};

// ── Google Strategy ───────────────────────────────────────────────────────────
// Strategy is registered lazily inside a function so process.env is read at
// call time (after dotenv has loaded), not at module parse time.
const registerGoogleStrategy = () => {
  const clientID     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL  = process.env.GOOGLE_CALLBACK_URL ||
                       `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

  if (!clientID || !clientSecret) {
    console.warn('[Passport] Google strategy NOT registered — missing credentials');
    return;
  }

  console.log('[Passport] Registering Google strategy — callbackURL:', callbackURL);

  passport.use('google', new GoogleStrategy(
    { clientID, clientSecret, callbackURL },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        console.log('[Google Strategy] Profile received — id:', profile.id, '| emails:', profile.emails);
        const email = profile.emails?.[0]?.value?.toLowerCase().trim();
        if (!email) {
          console.error('[Google Strategy] No email in profile');
          return done(new Error('No email returned from Google'), null);
        }
        const name   = profile.displayName || email.split('@')[0];
        const avatar = profile.photos?.[0]?.value || '';
        const user   = await findOrCreateOAuthUser({ email, name, avatar, isGoogleUser: true });
        console.log('[Google Strategy] Done — user:', user.email);
        return done(null, user);
      } catch (err) {
        console.error('[Google Strategy] Error:', err.message);
        return done(err, null);
      }
    }
  ));
  console.log('[Passport] Google strategy registered ✓');
};

// ── GitHub Strategy ───────────────────────────────────────────────────────────
const registerGithubStrategy = () => {
  const clientID     = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackURL  = process.env.GITHUB_CALLBACK_URL ||
                       `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`;

  if (!clientID || !clientSecret) {
    console.warn('[Passport] GitHub strategy NOT registered — missing credentials');
    return;
  }

  console.log('[Passport] Registering GitHub strategy — callbackURL:', callbackURL);

  passport.use('github', new GitHubStrategy(
    { clientID, clientSecret, callbackURL, scope: ['user:email'] },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        console.log('[GitHub Strategy] Profile received — username:', profile.username, '| emails:', profile.emails);
        const rawEmail = profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;
        const email      = rawEmail.toLowerCase().trim();
        const name       = profile.displayName || profile.username || email.split('@')[0];
        const githubUser = profile.username || '';
        const avatar     = profile.photos?.[0]?.value || '';
        const user       = await findOrCreateOAuthUser({ email, name, avatar, githubUser });
        console.log('[GitHub Strategy] Done — user:', user.email);
        return done(null, user);
      } catch (err) {
        console.error('[GitHub Strategy] Error:', err.message);
        return done(err, null);
      }
    }
  ));
  console.log('[Passport] GitHub strategy registered ✓');
};

// Register both strategies now (env is loaded by the time this module is imported
// because app.js imports env.js first)
registerGoogleStrategy();
registerGithubStrategy();

export default passport;
