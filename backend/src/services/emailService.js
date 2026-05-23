import nodemailer from 'nodemailer';

/**
 * Create transporter — uses Gmail SMTP by default.
 * Falls back silently if EMAIL_USER / EMAIL_PASS are not set.
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use Gmail App Password, not account password
    },
  });
};

/**
 * Professional HTML welcome email template
 */
const buildWelcomeEmail = (name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to DevInspectAI</title>
</head>
<body style="margin:0;padding:0;background:#1a0a14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0a14;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#2d1020,#1a0a14);border-radius:20px;border:1px solid rgba(236,72,153,0.2);overflow:hidden;max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,rgba(236,72,153,0.15),rgba(168,85,247,0.15));padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(236,72,153,0.15);">
              <div style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);border-radius:16px;padding:14px 18px;margin-bottom:16px;">
                <span style="font-size:28px;">✨</span>
              </div>
              <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#ec4899,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px;">DevInspectAI</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:13px;">Premium AI Code Analysis Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f9f0f5;">
                Welcome aboard, ${name}! 🎉
              </h2>
              <p style="margin:0 0 20px;color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;">
                You've successfully signed in to <strong style="color:#ec4899;">DevInspectAI</strong> using Google. Your account is ready and you can start analyzing code immediately.
              </p>

              <!-- Feature highlights -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                ${[
                  ['🔍', 'AI Code Review', 'Deep analysis for bugs, security issues, and optimizations'],
                  ['🎯', 'Interview Mode', 'Practice coding interviews with real-time AI feedback'],
                  ['📊', 'Dashboard Analytics', 'Track your code quality trends over time'],
                  ['🤝', 'Team Collaboration', 'Share reviews and work together in real-time'],
                ].map(([icon, title, desc]) => `
                <tr>
                  <td style="padding:10px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" style="vertical-align:top;">
                          <div style="background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.2);border-radius:10px;width:36px;height:36px;text-align:center;line-height:36px;font-size:18px;">${icon}</div>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#f9f0f5;">${title}</p>
                          <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0 24px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
                   style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
                  Go to Dashboard →
                </a>
              </div>

              <p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px;text-align:center;line-height:1.6;">
                If you didn't sign in to DevInspectAI, you can safely ignore this email.<br/>
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(236,72,153,0.1);text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">
                © ${new Date().getFullYear()} DevInspectAI · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send welcome/login confirmation email
 * Silently fails if email is not configured
 */
export const sendWelcomeEmail = async (toEmail, userName) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[Email] Skipped — EMAIL_USER/EMAIL_PASS not configured');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"DevInspectAI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Welcome to DevInspectAI, ${userName}! ✨`,
      html: buildWelcomeEmail(userName),
    });
    console.log(`[Email] Welcome email sent to ${toEmail}`);
  } catch (err) {
    // Never crash the app if email fails
    console.error('[Email] Failed to send welcome email:', err.message);
  }
};
