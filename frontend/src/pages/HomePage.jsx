import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  Code2, 
  CheckCircle2,
  ArrowRight,
  Zap,
  Flame,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const { currentUser, currentMode } = useAuth();

  const stats = [
    { label: 'Total Reviews', value: '24', icon: Code2, color: 'baby-pink', gradient: 'from-baby-pink/20 to-baby-pink/5' },
    { label: 'Quality Score', value: '92%', icon: TrendingUp, color: 'lavender', gradient: 'from-lavender/20 to-lavender/5' },
    { label: 'Languages', value: '8', icon: Zap, color: 'pastel-blue', gradient: 'from-pastel-blue/20 to-pastel-blue/5' },
    { label: 'Issues Found', value: '156', icon: CheckCircle2, color: 'soft-peach', gradient: 'from-soft-peach/20 to-soft-peach/5' },
  ];

  const quickActions = [
    { label: 'Analyze Code', icon: Code2, path: '/analyzer', color: 'primary', gradient: 'from-primary to-primary/90' },
    { label: 'View Dashboard', icon: TrendingUp, path: '/dashboard', color: 'secondary', gradient: 'from-secondary to-secondary/90' },
    { label: 'View History', icon: Flame, path: '/history', color: 'accent', gradient: 'from-accent to-accent/90' },
    { label: 'Switch Mode', icon: Target, path: '/switch-mode', color: 'warning', gradient: 'from-warning to-warning/90' },
  ];

  return (
    <div className="min-h-screen p-6 sm:p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="w-24 h-24 rounded-3xl gradient-brand flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 glow-effect"
          >
            <Sparkles className="h-12 w-12 text-white animate-pulse" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-4"
          >
            Welcome back, <span className="text-gradient">{currentUser?.name || 'Developer'}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-muted-foreground mb-8"
          >
            {currentMode ? `Ready to analyze code in ${currentMode} mode` : 'Select a mode to get started'}
          </motion.p>

          {!currentMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/mode-selection">
                <Button className="btn-primary text-lg px-8 py-6 glow-effect">
                  Select Mode
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="card-glow bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 p-6 rounded-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className={`h-6 w-6 text-${stat.color}`} />
                  </div>
                </div>
                <p className="text-4xl font-bold mb-2 text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card-glass p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gradient">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={action.path}>
                    <Button className="w-full h-14 text-base btn-primary font-semibold rounded-2xl">
                      <Icon className="mr-2 h-5 w-5" />
                      {action.label}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-12 card-glow bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 rounded-3xl border border-primary/20"
        >
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-gradient">Keep up the great work!</h3>
              <p className="text-muted-foreground">
                You've been making excellent progress. Continue analyzing code to improve your skills and build a stronger portfolio.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;