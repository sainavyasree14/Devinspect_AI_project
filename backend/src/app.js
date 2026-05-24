// ⚠️  env.js MUST be the first import — loads .env before anything reads process.env
import './env.js';

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import authRoutes      from './routes/authRoutes.js';
import analysisRoutes  from './routes/analysisRoutes.js';
import userRoutes      from './routes/userRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import adminRoutes     from './routes/adminRoutes.js';
import chatRoutes      from './routes/chatRoutes.js';
import reviewRoutes    from './routes/reviewRoutes.js';
import aiRoutes        from './routes/aiRoutes.js';
import testRoutes      from './routes/testRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import uploadRoutes    from './routes/uploadRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import vscodeRoutes      from './routes/vscodeRoutes.js';
import { protect }     from './middleware/authMiddleware.js';
import { isAdmin }     from './middleware/roleMiddleware.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    console.warn('[CORS] Blocked origin:', origin);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true })); // required for OAuth form callbacks

// Session — required for Passport OAuth state/CSRF verification
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,   // set true only with HTTPS in production
    httpOnly: true,
    maxAge: 15 * 60 * 1000, // 15 min — only needed during OAuth handshake
  },
}));

app.use(passport.initialize());
app.use(passport.session());

/* ─── Public routes ──────────────────────────────── */
app.use('/api/auth',         authRoutes);
app.use('/api/review',       reviewRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/test',         testRoutes);
app.use('/api/interview',    interviewRoutes);
app.use('/api/upload',       uploadRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/vscode',       vscodeRoutes);

/* ─── Protected routes ───────────────────────────── */
app.use('/api/analysis',  analysisRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/chat',      chatRoutes);

/* ─── Admin routes ───────────────────────────────── */
app.use('/api/admin', protect, isAdmin, adminRoutes);

/* ─── Health check ───────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: {
      jwt:    Boolean(process.env.JWT_SECRET),
      google: Boolean(process.env.GOOGLE_CLIENT_ID),
      github: Boolean(process.env.GITHUB_CLIENT_ID),
      groq:   Boolean(process.env.GROQ_API_KEY),
    },
  });
});

/* ─── 404 handler ────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

/* ─── Global error handler ───────────────────────── */
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

export default app;
