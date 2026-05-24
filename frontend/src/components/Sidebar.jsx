import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Code2, 
  History, 
  Settings, 
  User, 
  Zap,
  LogOut,
  Shield,
  Brain,
  Flame,
  Trophy,
  Gamepad2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useStreak } from '@/contexts/StreakContext.jsx';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { currentMode, currentUser, logout } = useAuth();
  const { streak } = useStreak();
  const { t } = useTranslation();
  const [gamesOpen, setGamesOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, color: 'baby-pink' },
    { path: '/analyzer',  label: t('nav.analyzer'),  icon: Code2,           color: 'lavender' },
    { path: '/history',   label: t('nav.history'),   icon: History,         color: 'pastel-blue' },
    { path: '/interview',   label: t('nav.interview'),     icon: Brain,           color: 'soft-peach' },
    { path: '/leaderboard', label: 'Leaderboard',           icon: Trophy,          color: 'soft-peach' },
    { path: '/switch-mode', label: t('nav.modeSelection'), icon: Zap,             color: 'soft-peach' },
  ];

  const bottomItems = [
    { path: '/settings', label: t('nav.settings'), icon: Settings, color: 'light-rose' },
    { path: '/profile',  label: t('nav.profile'),  icon: User,     color: 'blush-pink' },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const getModeIcon = () => {
    if (currentMode === 'student') return <span className="w-2 h-2 rounded-full bg-baby-pink animate-pulse" />;
    if (currentMode === 'interviewer') return <span className="w-2 h-2 rounded-full bg-lavender animate-pulse" />;
    if (currentMode === 'developer') return <span className="w-2 h-2 rounded-full bg-pastel-blue animate-pulse" />;
    return null;
  };

  const getActiveGradient = (color) => {
    const gradients = {
      'baby-pink': 'from-baby-pink/20 to-baby-pink/5',
      'lavender': 'from-lavender/20 to-lavender/5',
      'pastel-blue': 'from-pastel-blue/20 to-pastel-blue/5',
      'soft-peach': 'from-soft-peach/20 to-soft-peach/5',
      'light-rose': 'from-light-rose/20 to-light-rose/5',
      'blush-pink': 'from-blush-pink/20 to-blush-pink/5',
    };
    return gradients[color] || 'from-primary/20 to-primary/5';
  };

  const getActiveTextColor = (color) => {
    const colors = {
      'baby-pink': 'text-baby-pink',
      'lavender': 'text-lavender',
      'pastel-blue': 'text-pastel-blue',
      'soft-peach': 'text-soft-peach',
      'light-rose': 'text-light-rose',
      'blush-pink': 'text-blush-pink',
    };
    return colors[color] || 'text-primary';
  };

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-sidebar-background/80 backdrop-blur-xl border-r border-border/30 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sidebar-scroll">
          {currentMode && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glow bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 mb-6"
            >
              {getModeIcon()}
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Mode</p>
                <p className="text-sm font-bold capitalize">{currentMode}</p>
              </div>
            </motion.div>
          )}
          
          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-4">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-orange-500">{streak} {t('dashboard.streak')}!</span>
            </div>
          )}

          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">{t('nav.mainMenu')}</p>
          <nav className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                      active
                        ? `bg-gradient-to-r ${getActiveGradient(item.color)} ${getActiveTextColor(item.color)} font-semibold shadow-lg`
                        : 'text-sidebar-foreground hover:bg-muted/50 font-medium'
                    )}
                  >
                    <Icon className={cn("h-5 w-5 transition-colors", active ? "" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                        style={{ background: `hsl(var(--${item.color}))` }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* 🎮 Code Break collapsible section */}
          <div className="mt-4">
            <button
              onClick={() => setGamesOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group"
            >
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-purple-300">🎮 Code Break</span>
              </div>
              <motion.div animate={{ rotate: gamesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-purple-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {gamesOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mt-1"
                >
                  <div className="pl-2 space-y-1 py-1">
                    {[
                      { emoji: '🐍', label: 'Snake',             path: '/code-break' },
                      { emoji: '⭕', label: 'Tic Tac Toe',       path: '/code-break' },
                      { emoji: '🐞', label: 'Debug Rush',        path: '/code-break' },
                      { emoji: '🧠', label: 'Memory Hash',       path: '/code-break' },
                      { emoji: '✊', label: 'Rock Paper Scissors', path: '/code-break' },
                      { emoji: '🐤', label: 'Flappy Bird',       path: '/code-break' },
                    ].map((g, i) => (
                      <motion.div
                        key={g.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link
                          to={g.path}
                          onClick={handleLinkClick}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-purple-300 hover:bg-purple-500/10 transition-all duration-200 group"
                        >
                          <span className="text-base group-hover:scale-110 transition-transform">{g.emoji}</span>
                          <span>{g.label}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-border/30">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">{t('nav.account')}</p>
          <nav className="space-y-2 mb-4">
            {bottomItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                >
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                      active
                        ? `bg-gradient-to-r ${getActiveGradient(item.color)} ${getActiveTextColor(item.color)} font-semibold shadow-lg`
                        : 'text-sidebar-foreground hover:bg-muted/50 font-medium'
                    )}
                  >
                    <Icon className={cn("h-5 w-5 transition-colors", active ? "" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeIndicatorBottom"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                        style={{ background: `hsl(var(--${item.color}))` }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}

            {/* Admin link — only visible to admin users */}
            {currentUser?.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Link
                  to="/admin"
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                    isActive('/admin')
                      ? 'bg-destructive/10 text-destructive font-semibold shadow-lg'
                      : 'text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive font-medium'
                  )}
                >
                  <Shield className="h-5 w-5" />
                  <span>{t('nav.adminPanel')}</span>
                </Link>
              </motion.div>
            )}
          </nav>
          
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              handleLinkClick();
            }}
            className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-medium transition-all duration-300"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('nav.logout')}</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;