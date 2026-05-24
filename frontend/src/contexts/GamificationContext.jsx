import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useConfetti } from '@/hooks/useConfetti.js';

const GamificationContext = createContext();

export const BADGES = [
  { id: 'first_review',    label: 'First Review',     icon: '🎯', desc: 'Complete your first code analysis',          color: 'from-blue-500/20 to-blue-600/10',    border: 'border-blue-500/30',   text: 'text-blue-400' },
  { id: 'clean_coder',     label: 'Clean Coder',       icon: '✨', desc: 'Achieve average score above 90%',            color: 'from-green-500/20 to-green-600/10',  border: 'border-green-500/30',  text: 'text-green-400' },
  { id: 'bug_slayer',      label: 'Bug Slayer',        icon: '🐛', desc: 'Fix 10+ bugs across analyses',               color: 'from-red-500/20 to-red-600/10',      border: 'border-red-500/30',    text: 'text-red-400' },
  { id: 'security_expert', label: 'Security Expert',   icon: '🛡️', desc: 'Detect 5+ critical security vulnerabilities', color: 'from-purple-500/20 to-purple-600/10',border: 'border-purple-500/30', text: 'text-purple-400' },
  { id: 'streak_3',        label: 'Consistency King',  icon: '🔥', desc: 'Analyze code 3 days in a row',               color: 'from-orange-500/20 to-orange-600/10',border: 'border-orange-500/30', text: 'text-orange-400' },
  { id: 'streak_7',        label: 'Week Warrior',      icon: '⚡', desc: 'Analyze code 7 days in a row',               color: 'from-yellow-500/20 to-yellow-600/10',border: 'border-yellow-500/30', text: 'text-yellow-400' },
  { id: 'xp_100',          label: 'Century Club',      icon: '💯', desc: 'Earn 100 XP points',                         color: 'from-cyan-500/20 to-cyan-600/10',    border: 'border-cyan-500/30',   text: 'text-cyan-400' },
  { id: 'xp_500',          label: 'Code Master',       icon: '🏆', desc: 'Earn 500 XP points',                         color: 'from-amber-500/20 to-amber-600/10',  border: 'border-amber-500/30',  text: 'text-amber-400' },
  { id: 'interview_crusher',label:'Interview Crusher',  icon: '🎤', desc: 'Score 80%+ on 3 interview questions',        color: 'from-pink-500/20 to-pink-600/10',    border: 'border-pink-500/30',   text: 'text-pink-400' },
  { id: 'logic_master',    label: 'Logic Master',      icon: '🧠', desc: 'Complete 10 analyses with 0 critical bugs',  color: 'from-indigo-500/20 to-indigo-600/10',border: 'border-indigo-500/30', text: 'text-indigo-400' },
];

const XP_RULES = { analysis: 10, critical_fix: 20, badge_unlock: 50, daily_streak: 5, interview_pass: 30 };

const LEVELS = [
  { level: 1, label: 'Beginner',    minXp: 0    },
  { level: 2, label: 'Learner',     minXp: 50   },
  { level: 3, label: 'Developer',   minXp: 150  },
  { level: 4, label: 'Engineer',    minXp: 300  },
  { level: 5, label: 'Senior Dev',  minXp: 500  },
  { level: 6, label: 'Architect',   minXp: 800  },
  { level: 7, label: 'Code Master', minXp: 1200 },
];

const getLevel = (xp) => {
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.minXp) current = l; }
  const idx  = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] || null;
  const pct  = next ? Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100) : 100;
  return { ...current, next, pct };
};

// ── User-scoped storage helpers ───────────────────────────────────────────────
const getCurrentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('devinspect-user') || '{}');
    return u.id || u._id || 'anonymous';
  } catch { return 'anonymous'; }
};

const storageKey = (uid) => `devinspect-gamification-${uid}`;

const loadForUser = (uid) => {
  try { return JSON.parse(localStorage.getItem(storageKey(uid)) || '{}'); }
  catch { return {}; }
};

const EMPTY_STATE = {
  xp: 0,
  earnedBadges: [],
  notifications: [],
  stats: { totalAnalyses: 0, bugCount: 0, securityCount: 0, interviewPasses: 0, perfectAnalyses: 0, streak: 0 },
};

export const GamificationProvider = ({ children }) => {
  const [uid, setUid]                     = useState(() => getCurrentUserId());
  const [xp, setXp]                       = useState(0);
  const [earnedBadges, setEarnedBadges]   = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats]                 = useState(EMPTY_STATE.stats);
  const [unreadCount, setUnreadCount]     = useState(0);
  const mascotTriggerRef                  = useRef(null);
  const triggerMascot = useCallback((event, overrides) => {
    mascotTriggerRef.current?.(event, overrides);
  }, []);

  // Load data for a specific user ID
  const loadUser = useCallback((userId) => {
    const d = loadForUser(userId || getCurrentUserId());
    setXp(d.xp ?? 0);
    setEarnedBadges(d.earnedBadges ?? []);
    const notifs = d.notifications ?? [];
    setNotifications(notifs.slice(0, 20));
    setUnreadCount(notifs.filter(n => !n.read).length);
    setStats(d.stats ?? { ...EMPTY_STATE.stats });
  }, []);

  // Mount: load current user
  useEffect(() => { loadUser(getCurrentUserId()); }, [loadUser]);

  // Cross-tab: reload when user changes in another tab
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'devinspect-user') {
        const newUid = getCurrentUserId();
        setUid(newUid);
        loadUser(newUid);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadUser]);

  const persist = useCallback((updates) => {
    const userId = getCurrentUserId();
    const current = loadForUser(userId);
    localStorage.setItem(storageKey(userId), JSON.stringify({ ...current, ...updates }));
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
    setEarnedBadges(prev => {
      if (prev.includes(badgeId)) return prev;
      const badge = BADGES.find(b => b.id === badgeId);
      if (!badge) return prev;

      const updated = [...prev, badgeId];
      persist({ earnedBadges: updated });

      setXp(prevXp => {
        const newXp = prevXp + XP_RULES.badge_unlock;
        persist({ xp: newXp });
        return newXp;
      });

      addNotification({ type: 'badge', title: `Badge Unlocked: ${badge.label}`, message: badge.desc, icon: badge.icon });
      toast.success(`${badge.icon} Badge Unlocked: ${badge.label}!`, { duration: 4000 });
      return updated;
    });
  }, [persist, addNotification]);

  const addXp = useCallback((amount, reason = '') => {
    setXp(prev => {
      const updated = prev + amount;
      persist({ xp: updated });
      return updated;
    });
    if (reason) addNotification({ type: 'xp', title: `+${amount} XP`, message: reason, icon: '⚡' });
  }, [addNotification, persist]);

  const recordAnalysis = useCallback(({ score = 100, errors = [], mode = 'developer', streak = 0 } = {}) => {
    setStats(prev => {
      const next = { ...prev };
      next.totalAnalyses += 1;

      const criticalCount = errors.filter(e => String(e.severity || '').toLowerCase().includes('critical')).length;
      const securityCount = errors.filter(e => String(e.severity || '').toLowerCase().includes('security') || String(e.type || '').toLowerCase().includes('security')).length;
      next.bugCount      += errors.length;
      next.securityCount += criticalCount;
      if (score >= 90) next.perfectAnalyses += 1;
      next.streak = streak;

      persist({ stats: next });

      const xpGained = XP_RULES.analysis + (criticalCount > 0 ? XP_RULES.critical_fix * criticalCount : 0);
      addXp(xpGained, `Code analysis completed (Score: ${score})`);

      // Badge checks (use next values)
      if (next.totalAnalyses === 1)                              unlockBadge('first_review');
      if (next.bugCount >= 10)                                   unlockBadge('bug_slayer');
      if (next.securityCount >= 5)                               unlockBadge('security_expert');
      if (next.perfectAnalyses >= 5)                             unlockBadge('clean_coder');
      if (next.totalAnalyses >= 10 && next.bugCount === 0)       unlockBadge('logic_master');
      if (streak >= 3)                                           unlockBadge('streak_3');
      if (streak >= 7)                                           unlockBadge('streak_7');

      const tips = {
        student:    ['Try to reduce unused variables', 'Add comments to explain your logic', 'Practice edge case handling'],
        developer:  ['Consider time complexity', 'Add input validation', 'Review security best practices'],
        interviewer:['Check candidate code for edge cases', 'Look for optimal solutions', 'Review time complexity'],
      };
      addNotification({ type: 'tip', title: 'AI Tip', message: tips[mode]?.[Math.floor(Math.random() * 3)] || tips.developer[0], icon: '💡' });

      return next;
    });
  }, [addXp, unlockBadge, addNotification, persist]);

  const recordInterviewResult = useCallback((score = 0) => {
    if (score < 80) return;
    setStats(prev => {
      const next = { ...prev, interviewPasses: prev.interviewPasses + 1 };
      persist({ stats: next });
      addXp(XP_RULES.interview_pass, 'Interview question passed!');
      if (next.interviewPasses >= 3) unlockBadge('interview_crusher');
      return next;
    });
  }, [addXp, unlockBadge, persist]);

  // XP milestone badges
  const prevLevelRef = useRef(null);
  useEffect(() => {
    setEarnedBadges(prev => {
      if (xp >= 100 && !prev.includes('xp_100')) { unlockBadge('xp_100'); }
      if (xp >= 500 && !prev.includes('xp_500')) { unlockBadge('xp_500'); }
      return prev;
    });
    const lvl = getLevel(xp);
    if (prevLevelRef.current !== null && lvl.level > prevLevelRef.current) {
      triggerMascot('levelUp', { message: `You reached Level ${lvl.level}: ${lvl.label}! 🌟` });
    }
    prevLevelRef.current = lvl.level;
  }, [xp]); // eslint-disable-line react-hooks/exhaustive-deps

  const levelInfo = getLevel(xp);

  return (
    <GamificationContext.Provider value={{
      xp, levelInfo, earnedBadges, notifications, unreadCount, stats,
      BADGES, XP_RULES, LEVELS,
      addXp, unlockBadge, recordAnalysis, recordInterviewResult,
      addNotification, markAllRead, clearNotifications,
      triggerMascot, mascotTriggerRef,
      loadUser,
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => useContext(GamificationContext);
