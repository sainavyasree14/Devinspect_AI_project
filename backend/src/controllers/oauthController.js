import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../services/emailService.js';

export const oauthCallback = async (req, res) => {
  try {
    console.log('[oauthCallback] req.user:', req.user?.email, '| _id:', req.user?._id);

    if (!req.user) {
      console.error('[oauthCallback] No req.user — redirecting to error');
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
      );
    }

    const user = req.user;
    const token = generateToken(user._id, {
      email:       user.email,
      name:        user.name,
      role:        user.role        || 'user',
      currentMode: user.currentMode || 'developer',
      avatar:      user.avatar      || '',
    });

    console.log('[oauthCallback] JWT generated — redirecting to /oauth-callback');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Non-blocking welcome email for new users
    if (user._isNewOAuthUser) {
      sendWelcomeEmail(user.email, user.name).catch((e) =>
        console.warn('[oauthCallback] Welcome email failed (non-fatal):', e.message)
      );
    }

    return res.redirect(`${frontendUrl}/oauth-callback?token=${token}`);
  } catch (err) {
    console.error('[oauthCallback] Unexpected error:', err);
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
    );
  }
};
