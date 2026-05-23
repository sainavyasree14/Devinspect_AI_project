import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useGamification, BADGES } from '@/contexts/GamificationContext.jsx';

const BadgeCard = ({ badge, earned, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
    whileHover={earned ? { scale: 1.08, y: -4 } : { scale: 1.02 }}
    className={`relative p-4 rounded-2xl border transition-all ${
      earned
        ? `bg-gradient-to-br ${badge.color} ${badge.border} shadow-lg`
        : 'bg-muted/20 border-border/20 opacity-50'
    }`}
  >
    {earned && (
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${badge.color} blur-xl -z-10`}
      />
    )}

    <div className="flex flex-col items-center text-center gap-2">
      <span className={`text-3xl ${earned ? '' : 'grayscale'}`}>{badge.icon}</span>
      <p className={`text-xs font-bold ${earned ? badge.text : 'text-muted-foreground'}`}>{badge.label}</p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{badge.desc}</p>
      {!earned && (
        <div className="flex items-center gap-1 mt-1">
          <Lock className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/50">Locked</span>
        </div>
      )}
      {earned && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/30 ${badge.text}`}>Earned ✓</span>
      )}
    </div>
  </motion.div>
);

const BadgeShowcase = ({ compact = false }) => {
  const { earnedBadges } = useGamification();

  if (compact) {
    const earned = BADGES.filter(b => earnedBadges.includes(b.id));
    if (earned.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {earned.map(b => (
          <motion.span
            key={b.id}
            whileHover={{ scale: 1.1 }}
            title={b.label}
            className={`text-xl cursor-default`}
          >
            {b.icon}
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {BADGES.map((badge, i) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earned={earnedBadges.includes(badge.id)}
          index={i}
        />
      ))}
    </div>
  );
};

export default BadgeShowcase;
