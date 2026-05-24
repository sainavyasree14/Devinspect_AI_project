import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StreakContext = createContext();

const BADGES = [
  { id: 'first_review', label: 'First Review', icon: '🎯' },
  { id: 'streak_3',     label: '3-Day Streak', icon: '🔥' },
  { id: 'streak_7',     label: 'Week Warrior', icon: '⚡' },
  { id: 'xp_100',       label: 'Century Club', icon: '💯' },
  { id: 'xp_500',       label: 'Code Master',  icon: '🏆' },
];

const getCurrentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('devinspect-user') || '{}');
    return u.id || u._id || 'anonymous';
  } catch { return 'anonymous'; }
};

const storageKey = (uid) => `devinspect-streak-${uid}`;

const loadData = (uid) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(uid)) || '{}');
  } catch { return {}; }
};

const EMPTY = { streak: 0, xp: 0, badges: [], lastReviewDate: null };

export const StreakProvider = ({ children }) => {
  const [data, setData] = useState(EMPTY);

  const loadUser = useCallback(() => {
    const uid = getCurrentUserId();
    const d   = loadData(uid);
    setData({
      streak:         d.streak         ?? 0,
      xp:             d.xp             ?? 0,
      badges:         d.badges         ?? [],
      lastReviewDate: d.lastReviewDate ?? null,
    });
  }, []);

  // Load on mount
  useEffect(() => { loadUser(); }, [loadUser]);

  // Reload when another tab changes the user
  useEffect(() => {
    const handler = (e) => { if (e.key === 'devinspect-user') loadUser(); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadUser]);

  const persist = useCallback((next) => {
    const uid = getCurrentUserId();
    localStorage.setItem(storageKey(uid), JSON.stringify(next));
    setData(next);
  }, []);

  const recordReview = useCallback((score = 100) => {
    const today     = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    setData(prev => {
      let newStreak = prev.streak;
      if (prev.lastReviewDate === today) {
        // already reviewed today — only add XP
      } else if (prev.lastReviewDate === yesterday) {
        newStreak = prev.streak + 1;
      } else {
        newStreak = 1;
      }

      const xpGained = 10 + Math.floor(score / 10);
      const newXp    = prev.xp + xpGained;

      const newBadges = [...prev.badges];
      if (!newBadges.includes('first_review') && newXp >= 10)    newBadges.push('first_review');
      if (!newBadges.includes('streak_3')     && newStreak >= 3) newBadges.push('streak_3');
      if (!newBadges.includes('streak_7')     && newStreak >= 7) newBadges.push('streak_7');
      if (!newBadges.includes('xp_100')       && newXp >= 100)   newBadges.push('xp_100');
      if (!newBadges.includes('xp_500')       && newXp >= 500)   newBadges.push('xp_500');

      const next = { streak: newStreak, xp: newXp, badges: newBadges, lastReviewDate: today };
      const uid  = getCurrentUserId();
      localStorage.setItem(storageKey(uid), JSON.stringify(next));
      return next;
    });
  }, []);

  const getEarnedBadges = useCallback(
    () => BADGES.filter(b => data.badges.includes(b.id)),
    [data.badges]
  );

  return (
    <StreakContext.Provider value={{
      streak:         data.streak,
      xp:             data.xp,
      badges:         data.badges,
      getEarnedBadges,
      recordReview,
      loadUser,
      BADGES,
    }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => useContext(StreakContext);
