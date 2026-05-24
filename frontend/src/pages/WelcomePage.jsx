import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Code2, Brain, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';

// Floating particle positions — fixed so no hydration mismatch
const PARTICLES = [
  { top: '10%', left: '8%',  size: 'w-1.5 h-1.5', delay: 0 },
  { top: '20%', left: '85%', size: 'w-2 h-2',     delay: 0.4 },
  { top: '35%', left: '15%', size: 'w-1 h-1',     delay: 0.8 },
  { top: '55%', left: '90%', size: 'w-1.5 h-1.5', delay: 0.2 },
  { top: '70%', left: '5%',  size: 'w-2 h-2',     delay: 1.0 },
  { top: '80%', left: '75%', size: 'w-1 h-1',     delay: 0.6 },
  { top: '15%', left: '50%', size: 'w-1.5 h-1.5', delay: 1.2 },
  { top: '90%', left: '40%', size: 'w-1 h-1',     delay: 0.3 },
];

const FEATURES = [
  { icon: Code2,  label: 'AI Code Review',    color: 'text-primary',   bg: 'bg-primary/10'   },
  { icon: Brain,  label: 'Interview Prep',    color: 'text-secondary', bg: 'bg-secondary/10' },
  { icon: Zap,    label: 'Instant Analysis',  color: 'text-accent',    bg: 'bg-accent/10'    },
];

const WelcomePage = () => {
  const navigate  = useNavigate();
  const { currentUser, isAuthenticated, initialLoading } = useAuth();

  // Guard: if not authenticated after loading, send to login
  useEffect(() => {
    if (!initialLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [initialLoading, isAuthenticated, navigate]);

  const firstName = currentUser?.name?.split(' ')[0] || 'Developer';

  const handleStart = () => navigate('/mode-selection');

  if (initialLoading) return null;

  return (
    <>
      <Helmet><title>Welcome | DevInspectAI</title></Helmet>

      <div className="min-h-screen flex items-center justify-center bg-animated overflow-hidden relative px-4">

        {/* Background blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl pointer-events-none"
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -18, 0], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
            className={`absolute ${p.size} bg-primary/60 rounded-full pointer-events-none`}
            style={{ top: p.top, left: p.left }}
          />
        ))}

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className="card-glass rounded-3xl p-10 sm:p-14 text-center border border-border/30 shadow-2xl">

            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-8 rounded-3xl gradient-brand flex items-center justify-center shadow-xl shadow-primary/30"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>

            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <p className="text-muted-foreground text-lg font-medium mb-2 tracking-wide">
                Welcome back 👋
              </p>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-gradient mb-4 leading-tight">
                {firstName}
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                Ready to inspect smarter and code better?
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mt-8 mb-10"
            >
              {FEATURES.map(({ icon: Icon, label, color, bg }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${bg} border border-border/20 text-sm font-semibold ${color}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleStart}
                  className="btn-primary h-14 px-10 text-lg font-bold rounded-2xl glow-effect gap-3 group"
                >
                  Let's Get Started
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-xs text-muted-foreground/60 mt-4"
              >
                Choose your workspace mode to continue
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default WelcomePage;
