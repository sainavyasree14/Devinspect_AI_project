import React, { createContext, useContext, useState, useEffect } from 'react';

const StreakContext = createContext();

const BADGES = [
  { id: 'first_review', label: 'First Review', icon: '🎯', xpRequired: 0 },
  { id: 'streak_3', label: '3-Day Streak', icon: '🔥', xpRequired: 30 },
  { id: 'streak_7', label: 'Week Warrior', icon: '⚡', xpRequired: 70 },
  { id: 'xp_100', label: 'Century Club', icon: '💯', xpRequired: 100 },
  { id: 'xp_500', label: 'Code Master', icon: '🏆', xpRequired: 500 },
];

export const StreakProvider = ({ children }) => {
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState([]);
  const [lastReviewDate, setLastReviewDate] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('devinspect-streak');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setStreak(data.streak || 0);
        setXp(data.xp || 0);
        setBadges(data.badges || []);
        setLastReviewDate(data.lastReviewDate || null);
      } catch { /* ignore */ }
    }
  }, []);

  const save = (data) => {
    localStorage.setItem('devinspect-streak', JSON.stringify(data));
  };

  const recordReview = (score = 100) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = streak;
    if (lastReviewDate === today) {
      // Already reviewed today, just add XP
    } else if (lastReviewDate === yesterday) {
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }

    const xpGained = 10 + Math.floor(score / 10);
    const newXp = xp + xpGained;

    // Check new badges
    const newBadges = [...badges];
    BADGES.forEach(b => {
      if (!newBadges.includes(b.id)) {
        if (b.id === 'first_review' && newXp >= 10) newBadges.push(b.id);
        if (b.id === 'streak_3' && newStreak >= 3) newBadges.push(b.id);
        if (b.id === 'streak_7' && newStreak >= 7) newBadges.push(b.id);
        if (b.id === 'xp_100' && newXp >= 100) newBadges.push(b.id);
        if (b.id === 'xp_500' && newXp >= 500) newBadges.push(b.id);
      }
    });

    const updated = { streak: newStreak, xp: newXp, badges: newBadges, lastReviewDate: today };
    setStreak(newStreak);
    setXp(newXp);
    setBadges(newBadges);
    setLastReviewDate(today);
    save(updated);

    return { xpGained, newStreak, newBadges: newBadges.filter(b => !badges.includes(b)) };
  };

  const getEarnedBadges = () => BADGES.filter(b => badges.includes(b.id));

  return (
    <StreakContext.Provider value={{ streak, xp, badges, getEarnedBadges, recordReview, BADGES }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => useContext(StreakContext);
