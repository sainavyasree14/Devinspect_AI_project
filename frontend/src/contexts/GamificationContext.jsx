import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useConfetti } from '@/hooks/useConfetti.js';

const GamificationContext = createContext();

export const BADGES = [
  { id: 'first_review',   label: 'First Review',          icon: '🎯', desc: 'Complete your first code analysis',          color: 'from-blue-500/20 to-blue-600/10',    border: 'border-blue-500/30',   text: 'text-blue-400' },
  { id: 'clean_coder',    label: 'Clean Coder',            icon: '✨', desc: 'Achieve average score above 90%',            color: 'from-green-500/20 to-green-600/10',  border: 'border-green-500/30',  text: 'text-green-400' },
  { id: 'bug_slayer',     label: 'Bug Slayer',             icon: '🐛', desc: 'Fix 10+ bugs across analyses',               color: 'from-red-500/20 to-red-600/10',      border: 'border-red-500/30',    text: 'text-red-400' },
  { id: 'security_expert',label: 'Security Expert',        icon: '🛡️', desc: 'Detect 5+ critical security vulnerabilities', color: 'from-purple-500/20 to-purple-600/10',border: 'border-purple-500/30', text: 'text-purple-400' },
  { id: 'streak_3',       label: 'Consistency King',       icon: '🔥', desc: 'Analyze code 3 days in a row',               color: 'from-orange-500/20 to-orange-600/10',border: 'border-orange-500/30', text: 'text-orange-400' },
  { id: 'streak_7',       label: 'Week Warrior',           icon: '⚡', desc: 'Analyze code 7 days in a row',               color: 'from-yellow-500/20 to-yellow-600/10',border: 'border-yellow-500/30', text: 'text-yellow-400' },
  { id: 'xp_100',         label: 'Century Club',           icon: '💯', desc: 'Earn 100 XP points',                         color: 'from-cyan-500/20 to-cyan-600/10',    border: 'border-cyan-500/30',   text: 'text-cyan-400' },
  { id: 'xp_500',         label: 'Code Master',            icon: '🏆', desc: 'Earn 500 XP points',                         color: 'from-amber-500/20 to-amber-600/10',  border: 'border-amber-500/30',  text: 'text-amber-400' },
  { id: 'interview_crusher',label:'Interview Crusher',     icon: '🎤', desc: 'Score 80%+ on 3 interview questions',        color: 'from-pink-500/20 to-pink-600/10',    border: 'border-pink-500/30',   text: 'text-pink-400' },
  { id: 'logic_master',   label: 'Logic Master',           icon: '🧠', desc: 'Complete 10 analyses with 0 critical bugs',  color: 'from-indigo-500/20 to-indigo-600/10',border: 'border-indigo-500/30', text: 'text-indigo-400' },
];

const XP_RULES = {
  analysis:       10,
  critical_fix:   20,
  badge_unlock:   50,
  daily_streak:    5,
  interview_pass: 30,
};

const LEVELS = [
  { level: 1, label: 'Beginner',    minXp: 0   },
  { level: 2, label: 'Learner',     minXp: 50  },
  { level: 3, label: 'Developer',   minXp: 150 },
  { level: 4, label: 'Engineer',    minXp: 300 },
  { level: 5, label: 'Senior Dev',  minXp: 500 },
  { level: 6, label: 'Architect',   minXp: 800 },
  { level: 7, label: 'Code Master', minXp: 1200},
];

const getLevel = (xp) => {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l;
  }
  const idx   = LEVELS.indexOf(current);
  const next  = LEVELS[idx + 1] || null;
  const pct   = next ? Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100) : 100;
  return { ...current, next, pct };
};

const STORAGE_KEY = 'devinspect-gamification';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export const GamificationProvider = ({ children }) => {
  const [xp, setXp]                   = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats]             = useState({ totalAnalyses: 0, bugCount: 0, securityCount: 0, interviewPasses: 0, perfectAnalyses: 0, streak: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const d = load();
    if (d.xp)           setXp(d.xp);
    if (d.earnedBadges) setEarnedBadges(d.earnedBadges);
    if (d.notifications)setNotifications(d.notifications.slice(0, 20));
    if (d.stats)        setStats(d.stats);
    if (d.notifications)setUnreadCount(d.notifications.filter(n => !n.read).length);
  }, []);

  const persist = useCallback((updates) => {
    const current = load();
    const merged  = { ...current, ...updates };
    save(merged);
  }, []);

  const addNotification = useCallback((notif) => {
    const n = { id: Date.now(), read: false, timestamp: new Date().toISOString(), ...notif };
    setNotifications(prev => {
      const updated = [n, ...prev].slice(0, 20);
      persist({ notifications: updated });
      return updated;
    });
    setUnreadCount(c => c + 1);
  }, [persist]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persist({ notifications: updated });
      return updated;
    });
    setUnreadCount(0);
  }, [persist]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    persist({ notifications: [] });
  }, [persist]);

  const unlockBadge = useCallback((badgeId) => {
    if (earnedBadges.includes(badgeId)) return false;
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return false;

    setEarnedBadges(prev => {
      const updated = [...prev, badgeId];
      persist({ earnedBadges: updated });
      return updated;
    });

    // XP for badge
    setXp(prev => {
      const updated = prev + XP_RULES.badge_unlock;
      persist({ xp: updated });
      return updated;
    });

    addNotification({
      type: 'badge',
      title: `Badge Unlocked: ${badge.label}`,
      message: badge.desc,
      icon: badge.icon,
    });

    toast.success(`${badge.icon} Badge Unlocked: ${badge.label}!`, { duration: 4000 });
    return true;
  }, [earnedBadges, addNotification, persist]);

  const addXp = useCallback((amount, reason = '') => {
    setXp(prev => {
      const updated = prev + amount;
      persist({ xp: updated });
      return updated;
    });
    if (reason) {
      addNotification({ type: 'xp', title: `+${amount} XP`, message: reason, icon: '⚡' });
    }
  }, [addNotification, persist]);

  // Called after every analysis
  const recordAnalysis = useCallback(({ score = 100, errors = [], mode = 'developer', streak = 0 } = {}) => {
    const newStats = { ...stats };
    newStats.totalAnalyses += 1;

    const criticalCount = errors.filter(e => String(e.severity || '').toLowerCase().includes('critical')).length;
    newStats.bugCount       += errors.length;
    newStats.securityCount  += criticalCount;
    if (score >= 90) newStats.perfectAnalyses += 1;
    newStats.streak = streak;

    setStats(newStats);
    persist({ stats: newStats });

    // XP for analysis
    const xpGained = XP_RULES.analysis + (criticalCount > 0 ? XP_RULES.critical_fix * criticalCount : 0);
    addXp(xpGained, `Code analysis completed (Score: ${score})`);

    // Badge checks
    if (newStats.totalAnalyses === 1)          unlockBadge('first_review');
    if (newStats.bugCount >= 10)               unlockBadge('bug_slayer');
    if (newStats.securityCount >= 5)           unlockBadge('security_expert');
    if (newStats.perfectAnalyses >= 5)         unlockBadge('clean_coder');
    if (newStats.totalAnalyses >= 10 && newStats.bugCount === 0) unlockBadge('logic_master');
    if (streak >= 3)                           unlockBadge('streak_3');
    if (streak >= 7)                           unlockBadge('streak_7');

    // Smart notification based on mode
    const tips = {
      student:    ['Try to reduce unused variables', 'Add comments to explain your logic', 'Practice edge case handling'],
      developer:  ['Consider time complexity', 'Add input validation', 'Review security best practices'],
      interviewer:['Check candidate code for edge cases', 'Look for optimal solutions', 'Review time complexity'],
    };
    const tip = tips[mode]?.[Math.floor(Math.random() * 3)] || tips.developer[0];
    addNotification({ type: 'tip', title: 'AI Tip', message: tip, icon: '💡' });

    return xpGained;
  }, [stats, addXp, unlockBadge, addNotification, persist]);

  // Called after interview question scored
  const recordInterviewResult = useCallback((score = 0) => {
    if (score >= 80) {
      const newStats = { ...stats, interviewPasses: stats.interviewPasses + 1 };
      setStats(newStats);
      persist({ stats: newStats });
      addXp(XP_RULES.interview_pass, 'Interview question passed!');
      if (newStats.interviewPasses >= 3) unlockBadge('interview_crusher');
    }
  }, [stats, addXp, unlockBadge, persist]);

  const levelInfo = getLevel(xp);

  // XP milestone notifications
  useEffect(() => {
    if (xp >= 100 && !earnedBadges.includes('xp_100')) unlockBadge('xp_100');
    if (xp >= 500 && !earnedBadges.includes('xp_500')) unlockBadge('xp_500');
  }, [xp, earnedBadges, unlockBadge]);

  return (
    <GamificationContext.Provider value={{
      xp, levelInfo, earnedBadges, notifications, unreadCount, stats,
      BADGES, XP_RULES, LEVELS,
      addXp, unlockBadge, recordAnalysis, recordInterviewResult,
      addNotification, markAllRead, clearNotifications,
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => useContext(GamificationContext);
