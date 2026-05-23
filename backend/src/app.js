import express from 'express';
import cors from 'cors';
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
import { protect }     from './middleware/authMiddleware.js';
import { isAdmin }     from './middleware/roleMiddleware.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());

/* ─── Public routes ──────────────────────────────── */
app.use('/api/auth',      authRoutes);
app.use('/api/review',    reviewRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/test',      testRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/gamification', gamificationRoutes);

/* ─── Protected routes ───────────────────────────── */
app.use('/api/analysis',  analysisRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/chat',      chatRoutes);

/* ─── Admin routes (protect + isAdmin) ───────────── */
app.use('/api/admin', protect, isAdmin, adminRoutes);

/* ─── Health check ───────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ready:  Boolean(process.env.GROQ_API_KEY),
    providers: {
      groq:   { configured: Boolean(process.env.GROQ_API_KEY) },
      gemini: { configured: Boolean(process.env.GEMINI_API_KEY) },
    },
  });
});

/* ─── 404 handler ────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

/* ─── Error handler ──────────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

export default app;