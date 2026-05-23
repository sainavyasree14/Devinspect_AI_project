import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../services/emailService.js';

export const oauthCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
      );
    }

    const { _id, email, name, role, currentMode, isGoogleUser } = req.user;

    const token = generateToken(_id, { email, name, role, currentMode });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Send welcome email (non-blocking — never crashes the redirect)
    sendWelcomeEmail(email, name).catch(() => {});

    res.redirect(`${frontendUrl}/oauth-callback?token=${token}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
    );
  }
};
